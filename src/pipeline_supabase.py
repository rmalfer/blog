"""
Pipeline de automação: Google Sheets (IA & Robôs) → Ollama (Gemma 4:12b) → Supabase (Um Futuro Próximo).

Autor oficial: Riccardo Malfer
"""

import sys
import logging
import time
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from .auth import get_credentials
from .sheets_reader import SheetsReader
from .ollama_client import OllamaClient
from .image_fetcher import fetch_main_image
from .supabase_publisher import SupabasePublisher, slugify

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent


def load_settings(settings_path: str = None) -> dict:
    path = Path(settings_path) if settings_path else BASE_DIR / 'config' / 'settings.yaml'
    if not path.exists():
        raise FileNotFoundError(f"Arquivo de configuração não encontrado: {path}")
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def setup_logging(settings: dict):
    log_config = settings.get('logging', {})
    log_level = getattr(logging, log_config.get('level', 'INFO').upper(), logging.INFO)
    log_dir = BASE_DIR / log_config.get('directory', 'logs')
    log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = log_dir / f"supabase_sync_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    logger.info("Logging do Pipeline Supabase configurado: %s", log_file)


def run_supabase_pipeline(
    settings_path: str = None,
    dry_run: bool = False,
    import_all: bool = False,
    max_per_source: int = 10
) -> dict:
    """
    Executa o pipeline completo de ingestão para o portal Um Futuro Próximo no Supabase.
    """
    results = {
        'start_time': datetime.now().isoformat(),
        'total_read': 0,
        'total_published': 0,
        'total_errors': 0,
        'posts': [],
        'dry_run': dry_run,
        'import_all': import_all,
    }

    try:
        settings = load_settings(settings_path)
        setup_logging(settings)

        logger.info("=" * 65)
        logger.info("INICIANDO PIPELINE: GOOGLE SHEETS -> OLLAMA -> SUPABASE")
        logger.info("Portal: %s", settings.get('portal', {}).get('base_url', 'https://umfuturoproximo.vercel.app'))
        logger.info("Autor: %s", settings.get('portal', {}).get('author_name', 'Riccardo Malfer'))
        logger.info("Modo: %s", "DRY RUN (Simulação)" if dry_run else ("IMPORTAR TUDO" if import_all else "INCREMENTAL"))
        logger.info("=" * 65)

        # 1. Autenticação Google Sheets
        logger.info("Autenticando com Google Sheets API...")
        creds = get_credentials()

        # 2. Configura Supabase Publisher
        supabase_config = settings.get('supabase', {})
        # Dá preferência à chave service_role se disponível, senão usa publishable
        api_key = supabase_config.get('service_role_key') or supabase_config.get('publishable_key')
        publisher = SupabasePublisher(
            url=supabase_config['url'],
            key=api_key,
            portal_base_url=settings.get('portal', {}).get('base_url', 'https://umfuturoproximo.vercel.app')
        )

        # 3. Configura Ollama
        ollama_config = settings.get('ollama', {})
        ollama = OllamaClient(
            base_url=ollama_config.get('base_url', 'http://localhost:11434'),
            model=ollama_config.get('model', 'gemma4:12b'),
            temperature=ollama_config.get('temperature', 0.7),
            num_predict=ollama_config.get('num_predict', 2048),
            system_prompt=ollama_config.get('system_prompt', '')
        )

        ollama_available = ollama.is_available()
        if ollama_available:
            logger.info("✅ Ollama conectado em %s com modelo %s", ollama.base_url, ollama.model)
        else:
            logger.warning("⚠️ Ollama não acessível. O pipeline usará os resumos existentes na planilha.")

        # 4. Itera pelas fontes de dados (Planilha IA e Planilha Robôs)
        sources = settings.get('sources', [])
        for source in sources:
            source_id = source.get('id', 'sheet')
            cat_name = source.get('category_name', 'Inteligência Artificial')
            cat_slug = source.get('category_slug', 'inteligencia-artificial')
            sheet_id = source['spreadsheet_id']
            sheet_name = source.get('sheet_name', 'Página1')

            logger.info("=" * 50)
            logger.info("Processando Fonte: [%s] Categoria: %s", source_id, cat_name)
            logger.info("Spreadsheet ID: %s", sheet_id)

            reader = SheetsReader(credentials=creds, spreadsheet_id=sheet_id, sheet_name=sheet_name)

            if import_all:
                news_items = reader.get_all_news()
            else:
                news_items = reader.get_pending_news(max_items=max_per_source)

            results['total_read'] += len(news_items)
            logger.info("Encontradas %d notícias para processar nesta fonte", len(news_items))

            for idx, item in enumerate(news_items, start=1):
                logger.info("-" * 40)
                logger.info("[%s] Item %d/%d: '%s'", cat_name, idx, len(news_items), item['title'])

                post_res = {
                    'source': source_id,
                    'row': item['row_number'],
                    'title': item['title'],
                    'status': 'pending'
                }

                try:
                    title = item['title']
                    content = item.get('content', '')
                    link = item.get('link', '')

                    # Se o conteúdo estiver curto ou ausente, gera com Ollama Gemma
                    if ollama_available and (not content or len(content) < 150):
                        logger.info("Gerando artigo completo com Ollama Gemma (%s)...", ollama.model)
                        generated = ollama.generate_summary(title=title, content=content, link=link)
                        if generated:
                            content = generated
                            logger.info("✅ Artigo gerado pelo Gemma com sucesso!")
                    elif not content:
                        content = f"<p>Cobertura e análise detalhada sobre: <strong>{title}</strong>.</p>"

                    # Garante que o conteúdo tenha tags HTML básicas
                    if '<p>' not in content and '<div' not in content:
                        content = "".join(f"<p>{p.strip()}</p>" for p in content.split('\n\n') if p.strip())

                    # Busca imagem de capa
                    image_url = ''
                    if link:
                        logger.info("Buscando imagem de capa em: %s", link)
                        image_url = fetch_main_image(link) or ''
                        if image_url:
                            logger.info("Imagem de capa encontrada: %s", image_url)

                    article_data = {
                        'title': title,
                        'content': content,
                        'category_name': cat_name,
                        'category_slug': cat_slug,
                        'image_url': image_url,
                        'source_url': link,
                        'author_name': 'Riccardo Malfer',
                        'author_role': 'Editor & Especialista em IA',
                        'status': 'published',
                        'is_featured': (idx == 1 and not import_all),
                        'sheet_source': source_id,
                        'sheet_row': item['row_number'],
                    }

                    if dry_run:
                        logger.info("[DRY RUN] Artigo seria publicado: '%s' (/noticia/%s)", title, slugify(title))
                        post_res['status'] = 'dry_run'
                        results['total_published'] += 1
                    else:
                        pub_result = publisher.publish_article(article_data)
                        if pub_result:
                            post_url = pub_result['url']
                            post_res['status'] = 'published'
                            post_res['url'] = post_url
                            results['total_published'] += 1

                            # Atualiza a planilha no Google Sheets marcando 'Sim' e a nova URL pública
                            reader.mark_as_published(item['row_number'], post_url)
                            logger.info("✅ Planilha atualizada com a nova URL: %s", post_url)
                        else:
                            post_res['status'] = 'error'
                            post_res['error'] = 'Falha ao gravar no Supabase'
                            results['total_errors'] += 1

                except Exception as e:
                    logger.error("❌ Erro ao processar linha %d: %s", item.get('row_number'), e)
                    post_res['status'] = 'error'
                    post_res['error'] = str(e)
                    results['total_errors'] += 1

                results['posts'].append(post_res)

        results['end_time'] = datetime.now().isoformat()
        logger.info("=" * 65)
        logger.info("PIPELINE CONCLUÍDO COM SUCESSO")
        logger.info("Total lidas: %d | Total publicadas: %d | Erros: %d",
                    results['total_read'], results['total_published'], results['total_errors'])
        logger.info("=" * 65)

    except Exception as e:
        logger.error("Erro fatal no pipeline: %s", e, exc_info=True)
        results['error'] = str(e)
        results['end_time'] = datetime.now().isoformat()

    return results
