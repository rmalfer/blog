"""
Pipeline de automação alternativo: Google Sheets → Ollama → Blogger via E-mail.

Lê notícias da planilha, gera resumos com Ollama e envia diretamente para o
endereço de e-mail secreto do Blogger (sem passar pela API v3).
"""

import time
import logging
import yaml
from pathlib import Path
from datetime import datetime
from typing import Optional

from .auth import get_credentials
from .sheets_reader import SheetsReader
from .ollama_client import OllamaClient
from .post_formatter import PostFormatter
from .image_fetcher import fetch_main_image
from .email_client import BloggerEmailClient

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent


def load_settings(settings_path: str = None) -> dict:
    """Carrega configurações do settings.yaml."""
    path = Path(settings_path) if settings_path else BASE_DIR / 'config' / 'settings.yaml'
    if not path.exists():
        raise FileNotFoundError(f"Arquivo de configuração não encontrado: {path}")
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def setup_logging(settings: dict):
    """Configura o sistema de logging."""
    log_config = settings.get('logging', {})
    log_level = getattr(logging, log_config.get('level', 'INFO').upper(), logging.INFO)
    log_dir = BASE_DIR / log_config.get('directory', 'logs')
    log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = log_dir / f"blog_email_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    
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


def run_email_pipeline(settings_path: str = None, dry_run: bool = False) -> dict:
    """
    Executa o pipeline completo de publicação via e-mail.

    Args:
        settings_path: Caminho das configurações
        dry_run: Se True, simula sem enviar o e-mail

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
        settings = load_settings(settings_path)
        setup_logging(settings)

        logger.info("="*60)
        logger.info("INICIANDO PIPELINE DE PUBLICAÇÃO VIA E-MAIL")
        logger.info("Modo: %s", "DRY RUN (sem envio)" if dry_run else "PRODUÇÃO")
        logger.info("="*60)

        # 1. Configurações de e-mail
        email_config = settings.get('blogger_email', {})
        if not dry_run and not (email_config.get('sender_email') and email_config.get('sender_password') and email_config.get('blogger_secret_email')):
            raise ValueError(
                "Configurações de e-mail incompletas no settings.yaml!\n"
                "Preencha a seção 'blogger_email' com sender_email, sender_password e blogger_secret_email."
            )

        email_client = None
        if not dry_run:
            email_client = BloggerEmailClient(
                smtp_server=email_config.get('smtp_server', 'smtp.gmail.com'),
                smtp_port=email_config.get('smtp_port', 587),
                sender_email=email_config['sender_email'],
                sender_password=email_config['sender_password'],
                blogger_email=email_config['blogger_secret_email']
            )

        # 2. Autenticação Google Sheets
        logger.info("Autenticando com Google Sheets...")
        creds = get_credentials()

        sheets_config = settings['google_sheets']
        blogger_config = settings.get('blogger', {})
        ollama_config = settings.get('ollama', {})

        sheets = SheetsReader(
            credentials=creds,
            spreadsheet_id=sheets_config['spreadsheet_id'],
            sheet_name=sheets_config.get('sheet_name', 'Sheet1')
        )

        formatter = PostFormatter(
            default_labels=blogger_config.get('default_labels', [])
        )

        # 3. Ollama
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

        # 4. Ler notícias pendentes
        max_posts = blogger_config.get('max_posts_per_run', 5)
        pending_news = sheets.get_pending_news(max_items=max_posts)
        results['total_read'] = len(pending_news)

        if not pending_news:
            logger.info("Nenhuma notícia pendente encontrada. Encerrando.")
            results['end_time'] = datetime.now().isoformat()
            return results

        logger.info("📋 %d notícias pendentes para processar", len(pending_news))

        # 5. Processar cada notícia
        for idx, news in enumerate(pending_news, start=1):
            logger.info("-"*40)
            logger.info("Processando %d/%d: '%s'", idx, len(pending_news), news['title'])

            post_result = {
                'title': news['title'],
                'row': news['row_number'],
                'status': 'pending'
            }

            try:
                # Gera resumo com Ollama se necessário
                content = news.get('content', '')
                if ollama_available:
                    logger.info("Expandindo conteúdo com Ollama...")
                    generated = ollama.generate_summary(
                        title=news['title'],
                        content=content,
                        link=news.get('link', '')
                    )
                    if generated:
                        content = generated

                if not content:
                    content = f"<p>Notícia sobre: {news['title']}</p>"

                # Busca imagem principal
                image_url = ''
                link = news.get('link', '')
                if link:
                    logger.info("Buscando imagem principal de: %s", link)
                    image_url = fetch_main_image(link) or ''
                    if image_url:
                        logger.info("Imagem encontrada: %s", image_url)

                # Formata HTML
                post_data = formatter.format_post(
                    title=news['title'],
                    content=content,
                    link=link,
                    image_url=image_url
                )

                if dry_run:
                    logger.info("[DRY RUN] Post seria enviado por e-mail: '%s'", news['title'])
                    post_result['status'] = 'dry_run'
                    results['total_published'] += 1
                else:
                    # Envia por e-mail para o Blogger
                    success = email_client.send_post(
                        title=post_data['title'],
                        html_content=post_data['content']
                    )

                    if success:
                        post_result['status'] = 'published'
                        post_result['method'] = 'email'
                        results['total_published'] += 1

                        # Marca como publicado na planilha
                        sheets.mark_as_published(
                            row_number=news['row_number'],
                            post_url='Publicado via E-mail'
                        )
                        logger.info("✅ Linha %d marcada como publicada", news['row_number'])

                        # Pausa de 20 segundos entre envios para respeitar o limite de rajada do Gmail
                        logger.info("Aguardando 20s para o proximo envio...")
                        time.sleep(20)
                    else:
                        post_result['status'] = 'error'
                        post_result['error'] = 'Falha no envio do e-mail'
                        results['total_errors'] += 1
                        sheets.mark_as_error(news['row_number'], 'Falha no envio por email')

            except Exception as e:
                logger.error("❌ Erro ao processar '%s': %s", news['title'], e)
                post_result['status'] = 'error'
                post_result['error'] = str(e)
                results['total_errors'] += 1
                sheets.mark_as_error(news['row_number'], str(e)[:50])

            results['posts'].append(post_result)

        results['end_time'] = datetime.now().isoformat()
        logger.info("="*60)
        logger.info("PIPELINE VIA E-MAIL CONCLUÍDO")
        logger.info("Notícias lidas: %d", results['total_read'])
        logger.info("Posts enviados: %d", results['total_published'])
        logger.info("Erros: %d", results['total_errors'])
        logger.info("="*60)

    except Exception as e:
        logger.error("ERRO FATAL no pipeline: %s", e, exc_info=True)
        results['error'] = str(e)
        results['end_time'] = datetime.now().isoformat()

    return results
