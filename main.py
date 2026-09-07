#!/usr/bin/env python3
"""
Sistema Automatizado de Notícias de IA.

Lê notícias de uma planilha Google Sheets, gera resumos com Ollama (gemma4:12b)
e publica automaticamente no Blogger.

Uso:
    python main.py run              # Executa o pipeline uma vez
    python main.py run --dry-run    # Executa sem publicar (modo teste)
    python main.py auth             # Apenas faz autenticação OAuth
    python main.py list-blogs       # Lista blogs disponíveis
    python main.py daemon           # Roda como daemon com agendamento
"""

import sys
import os
import argparse
import logging
from pathlib import Path

# Garante encoding UTF-8 no console Windows
if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except (AttributeError, OSError):
        pass

# Adiciona o diretório do projeto ao path
PROJECT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR))


def cmd_run(args):
    """Executa o pipeline de publicação."""
    from src.pipeline import run_pipeline
    
    results = run_pipeline(dry_run=args.dry_run)
    
    print(f"\n{'='*50}")
    print(f"📊 RESULTADO DA EXECUÇÃO")
    print(f"{'='*50}")
    print(f"   Notícias lidas:    {results.get('total_read', 0)}")
    print(f"   Posts publicados:  {results.get('total_published', 0)}")
    print(f"   Erros:             {results.get('total_errors', 0)}")
    print(f"   Modo:              {'DRY RUN' if args.dry_run else 'PRODUÇÃO'}")
    
    if results.get('posts'):
        print(f"\n📝 Posts processados:")
        for post in results['posts']:
            status_icon = {'published': '✅', 'dry_run': '🔍', 'error': '❌'}.get(post['status'], '❓')
            print(f"   {status_icon} {post['title']}")
            if post.get('url'):
                print(f"      🔗 {post['url']}")
            if post.get('error'):
                print(f"      ⚠️ {post['error']}")
    
    print(f"{'='*50}")
    
    return 0 if results.get('total_errors', 0) == 0 else 1


def cmd_auth(args):
    """Realiza autenticação OAuth2 forçando login novo."""
    token_file = PROJECT_DIR / 'data' / 'token.json'
    if token_file.exists():
        try:
            token_file.unlink()
            print("🗑️ Token antigo removido para renovar permissões.")
        except Exception:
            pass

    from src.auth import get_credentials
    
    print("🔑 Iniciando autenticação OAuth2...")
    print("   Um navegador será aberto para autorizar o acesso.")
    print("   Certifique-se de marcar TODAS as caixas de permissão no navegador.\n")
    
    try:
        creds = get_credentials()
        print("\n✅ Autenticação concluída com sucesso!")
        print(f"   Token salvo em: {token_file}")
        print("   Você pode agora executar: python main.py run")
        return 0
    except Exception as e:
        print(f"\n❌ Erro na autenticação: {e}")
        return 1


def cmd_list_blogs(args):
    """Lista blogs disponíveis do usuário."""
    from src.auth import get_credentials
    from src.blogger_client import BloggerClient
    
    print("📋 Listando blogs do usuário...\n")
    
    try:
        creds = get_credentials()
        client = BloggerClient(credentials=creds, blog_id='')
        blogs = client.list_blogs()
        
        if not blogs:
            print("   Nenhum blog encontrado.")
            return 0
        
        for blog in blogs:
            print(f"   📝 {blog.get('name', 'Sem nome')}")
            print(f"      ID:  {blog.get('id')}")
            print(f"      URL: {blog.get('url')}")
            print(f"      Posts: {blog.get('posts', {}).get('totalItems', 0)}")
            print()
        
        return 0
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        return 1


def cmd_daemon(args):
    """Roda o pipeline como daemon com agendamento."""
    import time
    import schedule
    import yaml
    
    config_path = PROJECT_DIR / 'config' / 'settings.yaml'
    with open(config_path, 'r', encoding='utf-8') as f:
        settings = yaml.safe_load(f)
    
    run_time = settings.get('scheduler', {}).get('time', '09:00')
    
    print(f"🤖 Modo daemon ativado")
    print(f"   Horário de execução: {run_time} (diário)")
    print(f"   Pressione Ctrl+C para parar\n")
    
    def scheduled_run():
        print(f"\n⏰ Execução agendada iniciada: {__import__('datetime').datetime.now()}")
        from src.pipeline import run_pipeline
        run_pipeline()
    
    schedule.every().day.at(run_time).do(scheduled_run)
    
    print(f"   Próxima execução: {schedule.next_run()}")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Verifica a cada minuto
    except KeyboardInterrupt:
        print("\n\n🛑 Daemon interrompido pelo usuário.")
        return 0


def main():
    parser = argparse.ArgumentParser(
        description='Sistema Automatizado de Notícias de IA',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponíveis')
    
    # Comando: run
    run_parser = subparsers.add_parser('run', help='Executa o pipeline de publicação')
    run_parser.add_argument(
        '--dry-run', action='store_true',
        help='Executa sem publicar (modo teste)'
    )
    run_parser.set_defaults(func=cmd_run)
    
    # Comando: auth
    auth_parser = subparsers.add_parser('auth', help='Autenticação OAuth2')
    auth_parser.set_defaults(func=cmd_auth)
    
    # Comando: list-blogs
    blogs_parser = subparsers.add_parser('list-blogs', help='Lista blogs disponíveis')
    blogs_parser.set_defaults(func=cmd_list_blogs)
    
    # Comando: daemon
    daemon_parser = subparsers.add_parser('daemon', help='Roda como daemon agendado')
    daemon_parser.set_defaults(func=cmd_daemon)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
