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
import requests

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


def parse_sheet_date(date_str: str, row_number: int = 0) -> str:
    """
    Converte a string da 'Data de Inclusão' para formato ISO 8601 com timezone.
    Exemplos aceitos: '2026-08-05', '05/08/2026', '2026-08-05T12:00:00'.
    Define hora padrão em 12:mm:ss no fuso horário de Brasília (-03:00) para garantir
    que renderizações em fusos locais não alterem o dia exibido.
    """
    if not date_str:
        return datetime.now().astimezone().isoformat()

    date_clean = str(date_str).strip()
    seconds = min(row_number % 60, 59)
    minutes = min((row_number // 60) % 60, 59)
    try:
        if len(date_clean) == 10 and '-' in date_clean:
            dt = datetime.strptime(date_clean, "%Y-%m-%d")
            return f"{dt.strftime('%Y-%m-%d')}T12:{minutes:02d}:{seconds:02d}-03:00"
        elif len(date_clean) == 10 and '/' in date_clean:
            dt = datetime.strptime(date_clean, "%d/%m/%Y")
            return f"{dt.strftime('%Y-%m-%d')}T12:{minutes:02d}:{seconds:02d}-03:00"
        else:
            dt = datetime.fromisoformat(date_clean)
            if dt.tzinfo is None:
                return f"{dt.strftime('%Y-%m-%d')}T12:{minutes:02d}:{seconds:02d}-03:00"
            return dt.isoformat()
    except Exception as e:
        logger.warning("Não foi possível converter data '%s': %s. Usando data atual.", date_str, e)
        return datetime.now().astimezone().isoformat()


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
        logger.info("Portal: %s", settings.get('portal', {}).get('base_url', 'https://umfuturoproximo.com.br'))
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
            portal_base_url=settings.get('portal', {}).get('base_url', 'https://umfuturoproximo.com.br')
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
                    raw_summary = item.get('content', '').strip()
                    content = raw_summary
                    link = item.get('link', '')
                    existing_url = item.get('url', '').strip()
                    existing_slug = existing_url.rstrip('/').split('/')[-1] if existing_url and '/noticia/' in existing_url else slugify(title)

                    # Sempre expande o resumo da planilha em uma reportagem completa com Ollama Gemma
                    if ollama_available and (not content or len(content) < 1800):
                        logger.info("Gerando artigo completo com Ollama Gemma (%s)...", ollama.model)
                        generated = ollama.generate_summary(title=title, content=raw_summary, link=link)
                        if generated:
                            content = generated
                            logger.info("✅ Artigo gerado pelo Gemma com sucesso! (%d caracteres)", len(content))
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

                    published_date = parse_sheet_date(item.get('date', ''), item.get('row_number', 0))

                    article_data = {
                        'title': title,
                        'slug': existing_slug,
                        'excerpt': raw_summary,
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
                        'published_at': published_date,
                        'created_at': published_date,
                    }

                    if dry_run:
                        logger.info("[DRY RUN] Artigo seria publicado: '%s' (/noticia/%s)", title, existing_slug)
                        post_res['status'] = 'dry_run'
                        results['total_published'] += 1
                    else:
                        already_published = bool(existing_url and item.get('status', '').strip().lower() in ('sim', 'publicado', 'published'))
                        pub_result = publisher.publish_article(article_data, preserve_dates=already_published)
                        if pub_result:
                            post_url = existing_url if already_published else pub_result['url']
                            post_res['status'] = 'published'
                            post_res['url'] = post_url
                            results['total_published'] += 1

                            # Atualiza a planilha no Google Sheets se ainda não estava marcada como 'Sim'
                            if not already_published:
                                reader.mark_as_published(item['row_number'], post_url)
                                logger.info("✅ Planilha atualizada com a nova URL: %s", post_url)
                            else:
                                logger.info("✅ Artigo reprocessado mantendo URL e data originais: %s", post_url)
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


def sync_supabase_dates(settings_path: str = None) -> dict:
    """
    Atualiza as datas de publicação (published_at e created_at) dos artigos existentes no Supabase
    cruzando com a coluna 'Data de Inclusão' das planilhas Google Sheets configuradas.
    """
    settings = load_settings(settings_path)
    setup_logging(settings)

    logger.info("=" * 65)
    logger.info("INICIANDO SINCRONIZAÇÃO DE DATAS SUPABASE <- GOOGLE SHEETS")
    logger.info("=" * 65)

    creds = get_credentials()
    sources = settings.get('sources', [])
    sheet_items_by_coord = {}
    sheet_items_by_slug = {}

    for source in sources:
        source_id = source.get('id', 'sheet')
        sheet_id = source['spreadsheet_id']
        sheet_name = source.get('sheet_name', 'Página1')
        reader = SheetsReader(credentials=creds, spreadsheet_id=sheet_id, sheet_name=sheet_name)
        news_items = reader.get_all_news()
        logger.info("Lidas %d notícias da fonte '%s'", len(news_items), source_id)
        for item in news_items:
            coord = (source_id, item['row_number'])
            sheet_items_by_coord[coord] = item
            slug = slugify(item['title'])
            sheet_items_by_slug[slug] = item

    supabase_config = settings.get('supabase', {})
    api_key = supabase_config.get('service_role_key') or supabase_config.get('publishable_key')
    headers = {
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Range': '0-999',
    }
    url = f"{supabase_config['url'].rstrip('/')}/rest/v1/articles?select=id,title,slug,sheet_source,sheet_row,published_at,created_at"
    res = requests.get(url, headers=headers, timeout=20)
    res.raise_for_status()
    db_articles = res.json()

    logger.info("Total de artigos encontrados no Supabase: %d", len(db_articles))

    updated_count = 0
    errors_count = 0
    skipped_count = 0

    for art in db_articles:
        coord = (art.get('sheet_source'), art.get('sheet_row'))
        item = sheet_items_by_coord.get(coord)
        if not item:
            item = sheet_items_by_slug.get(art.get('slug'))

        if not item or not item.get('date'):
            logger.warning("Artigo ID %s ('%s') sem correspondência na planilha com data", art['id'], art['title'])
            skipped_count += 1
            continue

        target_iso = parse_sheet_date(item['date'], item.get('row_number', 0))

        patch_url = f"{supabase_config['url'].rstrip('/')}/rest/v1/articles?id=eq.{art['id']}"
        patch_payload = {
            'published_at': target_iso,
            'created_at': target_iso
        }
        try:
            patch_res = requests.patch(patch_url, json=patch_payload, headers=headers, timeout=15)
            patch_res.raise_for_status()
            logger.info("✅ Artigo [%s] '%s' atualizado para data: %s", art['id'][:8], art['title'][:40], target_iso)
            updated_count += 1
        except Exception as e:
            logger.error("❌ Falha ao atualizar artigo [%s]: %s", art['id'], e)
            errors_count += 1

    logger.info("=" * 65)
    logger.info("SINCRONIZAÇÃO DE DATAS CONCLUÍDA")
    logger.info("Total: %d | Atualizados: %d | Pulados: %d | Erros: %d",
                len(db_articles), updated_count, skipped_count, errors_count)
    logger.info("=" * 65)

    return {
        'total': len(db_articles),
        'updated': updated_count,
        'skipped': skipped_count,
        'errors': errors_count
    }


def reprocess_published_articles(
    settings_path: str = None,
    min_words: int = 250,
    workers: int = 2
) -> dict:
    """
    Reprocessa todas as notícias já publicadas nas planilhas do Google Drive,
    expandindo os textos curtos com o Ollama (gemma4:12b) e atualizando no Supabase
    utilizando exatamente os links (slugs) já publicados e sem alterar data e hora.
    """
    import re
    import concurrent.futures
    from .ollama_client import fetch_source_article_text
    from .supabase_publisher import calculate_reading_time

    settings = load_settings(settings_path)
    setup_logging(settings)

    logger.info("=" * 65)
    logger.info("INICIANDO REPROCESSAMENTO DE ARTIGOS PUBLICADOS (OLLAMA -> SUPABASE)")
    logger.info("=" * 65)

    creds = get_credentials()
    supabase_config = settings.get('supabase', {})
    api_key = supabase_config.get('service_role_key') or supabase_config.get('publishable_key')
    sup_url = supabase_config['url'].rstrip('/')
    headers = {
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Range': '0-999',
    }

    ollama_config = settings.get('ollama', {})
    ollama = OllamaClient(
        base_url=ollama_config.get('base_url', 'http://localhost:11434'),
        model=ollama_config.get('model', 'gemma4:12b'),
        temperature=ollama_config.get('temperature', 0.7),
        num_predict=ollama_config.get('num_predict', 1600),
        system_prompt=ollama_config.get('system_prompt', '')
    )

    if not ollama.is_available():
        raise RuntimeError(f"Ollama não está acessível em {ollama.base_url}")

    # 1. Busca todos os artigos existentes no Supabase
    res = requests.get(
        f"{sup_url}/rest/v1/articles?select=id,title,slug,content,excerpt,reading_time,category_name,category_slug,sheet_source,sheet_row,published_at,created_at,source_url,image_url,is_featured&order=published_at.desc",
        headers=headers,
        timeout=20
    )
    res.raise_for_status()
    db_articles = res.json()
    db_by_slug = {a['slug']: a for a in db_articles}
    db_by_coord = {(a.get('sheet_source'), a.get('sheet_row')): a for a in db_articles if a.get('sheet_source') and a.get('sheet_row')}
    logger.info("Artigos encontrados no Supabase: %d", len(db_articles))

    # 2. Lê todas as notícias marcadas como publicadas ('Sim') nas planilhas
    sources = settings.get('sources', [])
    tasks_by_slug = {}

    for source in sources:
        source_id = source.get('id', 'sheet')
        cat_name = source.get('category_name', 'Inteligência Artificial')
        cat_slug = source.get('category_slug', 'inteligencia-artificial')
        sheet_id = source['spreadsheet_id']
        sheet_name = source.get('sheet_name', 'Página1')
        reader = SheetsReader(credentials=creds, spreadsheet_id=sheet_id, sheet_name=sheet_name)
        all_rows = reader.get_all_news()

        for row in all_rows:
            status = row.get('status', '').strip().lower()
            if status not in ('sim', 'publicado', 'published'):
                continue
            existing_url = row.get('url', '').strip()
            slug = existing_url.rstrip('/').split('/')[-1] if existing_url and '/noticia/' in existing_url else slugify(row['title'])
            if slug in tasks_by_slug:
                continue  # Evita linhas duplicadas na planilha

            db_art = db_by_slug.get(slug) or db_by_coord.get((source_id, row['row_number']))
            tasks_by_slug[slug] = {
                'slug': slug,
                'row': row,
                'source_id': source_id,
                'cat_name': cat_name,
                'cat_slug': cat_slug,
                'db_art': db_art,
            }

    # Inclui também eventuais artigos do banco que não estavam mapeados mas sejam curtos
    for art in db_articles:
        if art['slug'] not in tasks_by_slug:
            tasks_by_slug[art['slug']] = {
                'slug': art['slug'],
                'row': None,
                'source_id': art.get('sheet_source'),
                'cat_name': art.get('category_name', 'Inteligência Artificial'),
                'cat_slug': art.get('category_slug', 'inteligencia-artificial'),
                'db_art': art,
            }

    # Filtra apenas os que precisam ser reprocessados (menos de min_words palavras ou ausentes do banco)
    to_process = []
    skipped = 0
    for slug, t in tasks_by_slug.items():
        db_art = t['db_art']
        if db_art:
            clean_txt = re.sub(r'<[^>]*>', ' ', db_art.get('content') or '')
            word_count = len(clean_txt.split())
            if word_count >= min_words:
                skipped += 1
                continue
        to_process.append(t)

    # Ordena dos mais recentes para os mais antigos (para atualizar a capa do site primeiro)
    def sort_key(t):
        if t['db_art'] and t['db_art'].get('published_at'):
            return t['db_art']['published_at']
        if t['row'] and t['row'].get('date'):
            return parse_sheet_date(t['row']['date'], t['row'].get('row_number', 0))
        return ''

    to_process.sort(key=sort_key, reverse=True)
    logger.info("Total únicos analisados: %d | Já longos (pulados): %d | Para reprocessar agora: %d",
                len(tasks_by_slug), skipped, len(to_process))

    if not to_process:
        return {'total': len(tasks_by_slug), 'updated': 0, 'skipped': skipped, 'errors': 0}

    # 3. Pré-carrega o texto das fontes originais em paralelo para não bloquear a GPU
    logger.info("Extraindo contexto das URLs de referência em paralelo (%d links)...", len(to_process))
    def prefetch(t):
        row = t['row']
        db_art = t['db_art']
        link = (row.get('link') if row else None) or (db_art.get('source_url') if db_art else '') or ''
        t['link'] = link
        t['source_text'] = fetch_source_article_text(link, timeout=5, max_chars=2500) if link else ''
        if not (db_art and db_art.get('image_url')) and link:
            t['fetched_image'] = fetch_main_image(link, timeout=5) or ''
        else:
            t['fetched_image'] = ''
        return t

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        to_process = list(pool.map(prefetch, to_process))
    logger.info("✅ Pré-carregamento concluído! Iniciando geração com Ollama (%s)...", ollama.model)

    updated = 0
    errors = 0

    def process_one(idx_and_task):
        idx, t = idx_and_task
        slug = t['slug']
        row = t['row']
        db_art = t['db_art']
        title = (db_art.get('title') if db_art else None) or (row.get('title') if row else '')
        raw_summary = (row.get('content', '').strip() if row else '') or (db_art.get('excerpt', '').strip() if db_art else '')
        link = t['link']
        source_text = t['source_text']

        generated = ollama.generate_summary(
            title=title,
            content=raw_summary,
            link=link,
            source_text=source_text,
            fetch_source=False
        )
        if not generated or len(generated) < 400:
            raise RuntimeError(f"Texto gerado muito curto ou vazio para '{title}'")

        if '<p>' not in generated and '<div' not in generated:
            generated = "".join(f"<p>{p.strip()}</p>" for p in generated.split('\n\n') if p.strip())

        clean_excerpt = re.sub(r'<[^>]*>', '', raw_summary).strip()
        if not clean_excerpt:
            clean_body = re.sub(r'<[^>]*>', ' ', generated).strip()
            clean_body = re.sub(r'\s+', ' ', clean_body)
            clean_excerpt = clean_body[:260].rsplit(' ', 1)[0] + '...' if len(clean_body) > 260 else clean_body

        reading_time = calculate_reading_time(generated)
        words_count = len(re.sub(r'<[^>]*>', ' ', generated).split())

        if db_art:
            # Atualiza artigo existente SEM mudar published_at, created_at ou slug
            patch_payload = {
                'content': generated,
                'excerpt': clean_excerpt,
                'reading_time': reading_time,
            }
            if not db_art.get('image_url') and t.get('fetched_image'):
                patch_payload['image_url'] = t['fetched_image']

            patch_url = f"{sup_url}/rest/v1/articles?id=eq.{db_art['id']}"
            r = requests.patch(patch_url, json=patch_payload, headers=headers, timeout=15)
            r.raise_for_status()
            logger.info("✅ [%d/%d] Atualizado (%d palavras | %s): %s [data preservada: %s]",
                        idx, len(to_process), words_count, reading_time, slug, db_art.get('published_at'))
        else:
            # Insere artigo que estava marcado 'Sim' na planilha mas ausente no banco, usando link e data originais
            pub_date = parse_sheet_date(row.get('date', ''), row.get('row_number', 0))
            insert_payload = {
                'title': title,
                'slug': slug,
                'excerpt': clean_excerpt,
                'content': generated,
                'category_name': t['cat_name'],
                'category_slug': t['cat_slug'],
                'image_url': t.get('fetched_image') or None,
                'source_url': link or None,
                'author_name': 'Riccardo Malfer',
                'author_role': 'Editor & Especialista em IA',
                'status': 'published',
                'is_featured': False,
                'reading_time': reading_time,
                'sheet_source': t['source_id'],
                'sheet_row': row.get('row_number') if row else None,
                'published_at': pub_date,
                'created_at': pub_date,
            }
            r = requests.post(f"{sup_url}/rest/v1/articles", json=insert_payload, headers=headers, timeout=15)
            r.raise_for_status()
            logger.info("✅ [%d/%d] Restaurado/Inserido (%d palavras | %s): %s [data original: %s]",
                        idx, len(to_process), words_count, reading_time, slug, pub_date)
        return True

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(process_one, (i, task)): (i, task) for i, task in enumerate(to_process, start=1)}
        for fut in concurrent.futures.as_completed(futures):
            i, task = futures[fut]
            try:
                fut.result()
                updated += 1
            except Exception as e:
                logger.error("❌ Erro ao reprocessar item %d (%s): %s", i, task['slug'], e)
                errors += 1

    logger.info("=" * 65)
    logger.info("REPROCESSAMENTO CONCLUÍDO")
    logger.info("Total analisados: %d | Reprocessados: %d | Pulados: %d | Erros: %d",
                len(tasks_by_slug), updated, skipped, errors)
    logger.info("=" * 65)
    return {'total': len(tasks_by_slug), 'updated': updated, 'skipped': skipped, 'errors': errors}


