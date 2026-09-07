"""
Pipeline de automação: Google Sheets → Ollama → Blogger.

Orquestra todo o fluxo de leitura, processamento e publicação de notícias.
"""

import logging
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional

from .auth import get_credentials
from .sheets_reader import SheetsReader
from .ollama_client import OllamaClient
from .post_formatter import PostFormatter
from .blogger_client import BloggerClient
from .image_fetcher import fetch_main_image

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent


def load_settings(settings_path: str = None) -> dict:
    """
    Carrega configurações do arquivo settings.yaml.
    
    Args:
        settings_path: Caminho para o arquivo de configurações
        
    Returns:
        Dicionário com as configurações
    """
    path = Path(settings_path) if settings_path else BASE_DIR / 'config' / 'settings.yaml'
    
    if not path.exists():
        raise FileNotFoundError(f"Arquivo de configuração não encontrado: {path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        settings = yaml.safe_load(f)
    
    logger.info("Configurações carregadas de %s", path)
    return settings


def setup_logging(settings: dict):
    """
    Configura o sistema de logging.
    
    Args:
        settings: Dicionário de configurações
    """
    log_config = settings.get('logging', {})
    log_level = getattr(logging, log_config.get('level', 'INFO').upper(), logging.INFO)
    log_dir = BASE_DIR / log_config.get('directory', 'logs')
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Nome do arquivo de log com data
    log_file = log_dir / f"blog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    
    # Configura logging para arquivo e console
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    
    logger.info("Logging configurado. Arquivo: %s", log_file)


def run_pipeline(settings_path: str = None, dry_run: bool = False) -> dict:
    """
    Executa o pipeline completo de automação.
    
    Args:
        settings_path: Caminho para o arquivo de configurações
        dry_run: Se True, não publica no Blogger (modo teste)
        
    Returns:
        Dicionário com resultados da execução
    """
    results = {
        'start_time': datetime.now().isoformat(),
        'total_read': 0,
        'total_published': 0,
        'total_errors': 0,
        'posts': [],
        'dry_run': dry_run,
    }
    
    try:
        # 1. Carrega configurações
        settings = load_settings(settings_path)
        setup_logging(settings)
        
        logger.info("="*60)
        logger.info("INICIANDO PIPELINE DE PUBLICAÇÃO")
        logger.info("Modo: %s", "DRY RUN (sem publicação)" if dry_run else "PRODUÇÃO")
        logger.info("="*60)
        
        # 2. Autenticação OAuth
        logger.info("Autenticando com Google APIs...")
        creds = get_credentials()
        
        # 3. Configurar componentes
        sheets_config = settings['google_sheets']
        blogger_config = settings['blogger']
        ollama_config = settings.get('ollama', {})
        
        sheets = SheetsReader(
            credentials=creds,
            spreadsheet_id=sheets_config['spreadsheet_id'],
            sheet_name=sheets_config.get('sheet_name', 'Sheet1')
        )
        
        formatter = PostFormatter(
            default_labels=blogger_config.get('default_labels', [])
        )
        
        blogger = BloggerClient(
            credentials=creds,
            blog_id=blogger_config['blog_id']
        )
        
        # Configura Ollama
        ollama = OllamaClient(
            base_url=ollama_config.get('base_url', 'http://localhost:11434'),
            model=ollama_config.get('model', 'gemma4:12b'),
            temperature=ollama_config.get('temperature', 0.7),
            num_predict=ollama_config.get('num_predict', 2048),
            system_prompt=ollama_config.get('system_prompt', '')
        )
        
        ollama_available = ollama.is_available()
        if ollama_available:
            logger.info("✅ Ollama disponível em %s", ollama_config.get('base_url'))
            if not ollama.is_model_available():
                logger.warning("⚠️ Modelo '%s' não encontrado no Ollama", ollama_config.get('model'))
                ollama_available = False
        else:
            logger.warning("⚠️ Ollama não disponível. Usando conteúdo original da planilha.")
        
        # 4. Ler notícias pendentes
        max_posts = blogger_config.get('max_posts_per_run', 10)
        pending_news = sheets.get_pending_news(max_items=max_posts)
        results['total_read'] = len(pending_news)
        
        if not pending_news:
            logger.info("Nenhuma notícia pendente encontrada. Encerrando.")
            results['end_time'] = datetime.now().isoformat()
            return results
        
        logger.info("📋 %d notícias pendentes para processar", len(pending_news))
        
        # 5. Processar cada notícia
        is_draft = blogger_config.get('publish_as_draft', False)
        
        for idx, news in enumerate(pending_news, start=1):
            logger.info("-"*40)
            logger.info("Processando %d/%d: '%s'", idx, len(pending_news), news['title'])
            
            post_result = {
                'title': news['title'],
                'row': news['row_number'],
                'status': 'pending'
            }
            
            try:
                # Decide se precisa gerar resumo com Ollama
                content = news.get('content', '')
                
                if ollama_available and (not content or len(content) < 100):
                    # Conteúdo curto ou ausente: gerar com Ollama
                    logger.info("Conteúdo curto/ausente. Gerando com Ollama...")
                    generated = ollama.generate_summary(
                        title=news['title'],
                        content=content,
                        link=news.get('link', '')
                    )
                    if generated:
                        content = generated
                        logger.info("✅ Resumo gerado pelo Ollama")
                    else:
                        logger.warning("Ollama não gerou conteúdo. Usando original.")
                elif ollama_available and content:
                    # Tem conteúdo mas pode expandir
                    logger.info("Expandindo conteúdo existente com Ollama...")
                    generated = ollama.generate_summary(
                        title=news['title'],
                        content=content,
                        link=news.get('link', '')
                    )
                    if generated:
                        content = generated
                
                if not content:
                    content = f"Notícia sobre: {news['title']}"
                    logger.warning("Usando conteúdo mínimo (sem Ollama e sem conteúdo original)")

                # Busca imagem principal do link da notícia
                image_url = ''
                link = news.get('link', '')
                if link:
                    logger.info("Buscando imagem principal de: %s", link)
                    image_url = fetch_main_image(link) or ''
                    if image_url:
                        logger.info("Imagem encontrada: %s", image_url)
                    else:
                        logger.info("Nenhuma imagem encontrada para esta noticia.")

                # Formatar post
                post_data = formatter.format_post(
                    title=news['title'],
                    content=content,
                    link=link,
                    image_url=image_url,
                )
                
                if dry_run:
                    logger.info("[DRY RUN] Post seria publicado: '%s'", news['title'])
                    post_result['status'] = 'dry_run'
                    results['total_published'] += 1
                else:
                    # Publicar no Blogger
                    result = blogger.create_post(post_data, is_draft=is_draft)
                    
                    if result:
                        post_url = result.get('url', '')
                        post_result['status'] = 'published'
                        post_result['url'] = post_url
                        results['total_published'] += 1
                        
                        # Marcar como publicado na planilha
                        sheets.mark_as_published(
                            row_number=news['row_number'],
                            post_url=post_url
                        )
                        logger.info("✅ Publicado: %s", post_url)

                        # Pequena pausa para respeitar limites de taxa do Blogger
                        import time
                        time.sleep(5)
                    else:
                        post_result['status'] = 'error'
                        post_result['error'] = 'Falha ao publicar no Blogger'
                        results['total_errors'] += 1
                        sheets.mark_as_error(news['row_number'], 'Falha ao publicar')
                
            except Exception as e:
                logger.error("❌ Erro ao processar '%s': %s", news['title'], e)
                post_result['status'] = 'error'
                post_result['error'] = str(e)
                results['total_errors'] += 1
                sheets.mark_as_error(news['row_number'], str(e)[:50])
            
            results['posts'].append(post_result)
        
        # 6. Resumo final
        results['end_time'] = datetime.now().isoformat()
        
        logger.info("="*60)
        logger.info("PIPELINE CONCLUÍDO")
        logger.info("Notícias lidas: %d", results['total_read'])
        logger.info("Posts publicados: %d", results['total_published'])
        logger.info("Erros: %d", results['total_errors'])
        logger.info("="*60)
        
    except Exception as e:
        logger.error("ERRO FATAL no pipeline: %s", e, exc_info=True)
        results['error'] = str(e)
        results['end_time'] = datetime.now().isoformat()
    
    return results
