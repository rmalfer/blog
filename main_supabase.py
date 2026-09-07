#!/usr/bin/env python3
"""
CLI do Portal Um Futuro Próximo.

Gerencia o fluxo de ingestão automática de notícias:
Google Sheets (IA & Robótica) -> Ollama (Gemma 4:12b) -> Supabase.

Autor: Riccardo Malfer
"""

import sys
import argparse
from pathlib import Path

# Adiciona o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Garante saída UTF-8 no Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from src.pipeline_supabase import run_supabase_pipeline, load_settings, sync_supabase_dates
from src.supabase_publisher import SupabasePublisher
from src.ollama_client import OllamaClient
from src.auth import get_credentials


def main():
    parser = argparse.ArgumentParser(
        description='Automação de Notícias para o Portal Um Futuro Próximo (Supabase + Ollama)'
    )
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponíveis')

    # Comando: run (padrão)
    run_parser = subparsers.add_parser('run', help='Executa o pipeline de publicação')
    run_parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Modo simulação: lê notícias e gera resumos sem gravar no Supabase ou atualizar planilhas'
    )
    run_parser.add_argument(
        '--max',
        type=int,
        default=5,
        help='Máximo de notícias a processar por fonte (padrão: 5)'
    )
    run_parser.add_argument(
        '--config',
        type=str,
        default=None,
        help='Caminho alternativo para settings.yaml'
    )

    # Comando: import-all
    import_parser = subparsers.add_parser('import-all', help='Importa todas as notícias das planilhas para o Supabase')
    import_parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Modo simulação para a importação em lote'
    )

    # Comando: sync-dates
    sync_parser = subparsers.add_parser('sync-dates', help='Atualiza as datas dos artigos no Supabase a partir das planilhas')
    sync_parser.add_argument(
        '--config',
        type=str,
        default=None,
        help='Caminho alternativo para settings.yaml'
    )

    # Comando: test
    subparsers.add_parser('test', help='Testa conexões com Google Sheets, Ollama e Supabase')

    args = parser.parse_args()

    # Se nenhum comando for passado, assume 'run'
    if not args.command:
        args.command = 'run'
        args.dry_run = False
        args.max = 5
        args.config = None

    if args.command == 'test':
        print("\n🔍 TESTANDO CONEXÕES DO SISTEMA...\n")
        settings = load_settings()

        # 1. Google Sheets
        try:
            print("1. Google Auth & Sheets:")
            creds = get_credentials()
            print("   ✅ Credenciais Google OAuth carregadas com sucesso!")
        except Exception as e:
            print(f"   ❌ Erro ao autenticar no Google: {e}")

        # 2. Ollama
        try:
            print("\n2. Ollama Local (Gemma):")
            ollama = OllamaClient(
                base_url=settings.get('ollama', {}).get('base_url', 'http://localhost:11434'),
                model=settings.get('ollama', {}).get('model', 'gemma4:12b')
            )
            if ollama.is_available():
                print(f"   ✅ Ollama online em {ollama.base_url}")
                if ollama.is_model_available():
                    print(f"   ✅ Modelo '{ollama.model}' disponível e pronto para uso!")
                else:
                    print(f"   ⚠️ Modelo '{ollama.model}' não encontrado. Modelos ativos no Ollama:")
            else:
                print(f"   ⚠️ Ollama não respondeu em {ollama.base_url}")
        except Exception as e:
            print(f"   ❌ Erro ao verificar Ollama: {e}")

        # 3. Supabase
        try:
            print("\n3. Supabase REST API:")
            sup_cfg = settings.get('supabase', {})
            key = sup_cfg.get('service_role_key') or sup_cfg.get('publishable_key')
            pub = SupabasePublisher(url=sup_cfg['url'], key=key)
            if pub.test_connection():
                print(f"   ✅ Supabase conectado com sucesso em {sup_cfg['url']}")
            else:
                print(f"   ⚠️ Não foi possível consultar a API do Supabase com a chave atual.")
        except Exception as e:
            print(f"   ❌ Erro ao conectar no Supabase: {e}")

        print("\n" + "=" * 50 + "\n")
        return

    if args.command == 'import-all':
        print("\n🚀 INICIANDO IMPORTAÇÃO EM LOTE DE TODAS AS NOTÍCIAS...\n")
        run_supabase_pipeline(dry_run=args.dry_run, import_all=True)
        return

    if args.command == 'sync-dates':
        print("\n📅 INICIANDO SINCRONIZAÇÃO DE DATAS COM AS PLANILHAS...\n")
        sync_supabase_dates(settings_path=getattr(args, 'config', None))
        return

    if args.command == 'run':
        run_supabase_pipeline(
            settings_path=getattr(args, 'config', None),
            dry_run=args.dry_run,
            max_per_source=args.max
        )


if __name__ == '__main__':
    main()
