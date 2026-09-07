#!/usr/bin/env python3
"""
Sistema Automatizado de Notícias de IA — Modo Publicação por E-mail.

Lê notícias da planilha Google Sheets, gera resumos com Ollama (gemma4:12b)
e publica automaticamente no Blogger via e-mail secreto (Mail-to-Blogger).

Uso:
    python main_email.py run              # Executa o envio por e-mail
    python main_email.py run --dry-run    # Simula sem enviar e-mail
    python main_email.py test             # Envia um e-mail de teste simples
"""

import sys
import os
import argparse
from pathlib import Path

# Garante encoding UTF-8 no console Windows
if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except (AttributeError, OSError):
        pass

PROJECT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR))


def cmd_run(args):
    """Executa o pipeline de publicação via e-mail."""
    from src.pipeline_email import run_email_pipeline
    
    results = run_email_pipeline(dry_run=args.dry_run)
    
    print(f"\n{'='*50}")
    print(f"📊 RESULTADO DA EXECUÇÃO (VIA E-MAIL)")
    print(f"{'='*50}")
    print(f"   Notícias lidas:    {results.get('total_read', 0)}")
    print(f"   Posts enviados:    {results.get('total_published', 0)}")
    print(f"   Erros:             {results.get('total_errors', 0)}")
    print(f"   Modo:              {'DRY RUN' if args.dry_run else 'PRODUÇÃO'}")
    
    if results.get('posts'):
        print(f"\n📝 Posts processados:")
        for post in results['posts']:
            status_icon = {'published': '📧', 'dry_run': '🔍', 'error': '❌'}.get(post['status'], '❓')
            print(f"   {status_icon} {post['title']}")
            if post.get('error'):
                print(f"      ⚠️ {post['error']}")
    
    print(f"{'='*50}")
    return 0 if results.get('total_errors', 0) == 0 else 1


def cmd_test(args):
    """Envia um post de teste isolado via e-mail para validar as credenciais SMTP."""
    import yaml
    from src.email_client import BloggerEmailClient

    settings_path = PROJECT_DIR / 'config' / 'settings.yaml'
    with open(settings_path, 'r', encoding='utf-8') as f:
        settings = yaml.safe_load(f)

    email_config = settings.get('blogger_email', {})
    if not (email_config.get('sender_email') and email_config.get('sender_password') and email_config.get('blogger_secret_email')):
        print("❌ Preencha as credenciais em config/settings.yaml na seção 'blogger_email' antes de testar.")
        return 1

    print(f"📧 Testando envio de e-mail para: {email_config['blogger_secret_email']}")
    client = BloggerEmailClient(
        smtp_server=email_config.get('smtp_server', 'smtp.gmail.com'),
        smtp_port=email_config.get('smtp_port', 587),
        sender_email=email_config['sender_email'],
        sender_password=email_config['sender_password'],
        blogger_email=email_config['blogger_secret_email']
    )

    success = client.send_post(
        title="Post de Teste Automatizado via E-mail",
        html_content="<p>Este é um post de teste enviado automaticamente via Python para o Blogger!</p>"
    )

    if success:
        print("\n✅ E-mail enviado com sucesso! Verifique seu blog no Blogger em alguns instantes.")
        return 0
    else:
        print("\n❌ Falha no envio do e-mail. Verifique suas credenciais no settings.yaml.")
        return 1


def main():
    parser = argparse.ArgumentParser(
        description='Sistema de Notícias de IA — Modo Publicação por E-mail',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    subparsers = parser.add_subparsers(dest='command', help='Comandos')

    run_parser = subparsers.add_parser('run', help='Executa o pipeline via e-mail')
    run_parser.add_argument('--dry-run', action='store_true', help='Modo simulação')
    run_parser.set_defaults(func=cmd_run)

    test_parser = subparsers.add_parser('test', help='Envia um post de teste isolado')
    test_parser.set_defaults(func=cmd_test)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return 1
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
