#!/usr/bin/env python3
"""
Configurador do Windows Task Scheduler.

Cria uma tarefa agendada para executar o pipeline de blog automaticamente.
"""

import os
import sys
import subprocess
from pathlib import Path


def find_python() -> str:
    """Encontra o caminho completo do executável Python."""
    return sys.executable


def create_scheduled_task(
    task_name: str = 'BlogAutoPost',
    time: str = '09:00',
    python_path: str = None,
    script_path: str = None
):
    """
    Cria uma tarefa no Windows Task Scheduler.
    
    Args:
        task_name: Nome da tarefa no Task Scheduler
        time: Horário de execução (HH:MM)
        python_path: Caminho do executável Python
        script_path: Caminho do script main.py
    """
    project_dir = Path(__file__).resolve().parent
    python_exe = python_path or find_python()
    main_script = script_path or str(project_dir / 'main.py')
    
    # Comando que será executado
    command = f'"{python_exe}" "{main_script}" run'
    
    print(f"📋 Configurando tarefa agendada no Windows Task Scheduler")
    print(f"   Nome da tarefa:  {task_name}")
    print(f"   Horário:         {time} (diário)")
    print(f"   Comando:         {command}")
    print(f"   Diretório:       {project_dir}")
    print()
    
    # Remove tarefa existente se houver
    subprocess.run(
        ['schtasks', '/delete', '/tn', task_name, '/f'],
        capture_output=True, text=True
    )
    
    # Cria nova tarefa
    result = subprocess.run(
        [
            'schtasks', '/create',
            '/tn', task_name,
            '/tr', command,
            '/sc', 'daily',
            '/st', time,
            '/rl', 'HIGHEST',
            '/f'
        ],
        capture_output=True, text=True
    )
    
    if result.returncode == 0:
        print(f"✅ Tarefa '{task_name}' criada com sucesso!")
        print(f"   Será executada diariamente às {time}")
        print(f"\n   Para verificar: schtasks /query /tn \"{task_name}\"")
        print(f"   Para remover:   schtasks /delete /tn \"{task_name}\" /f")
        print(f"   Para executar:  schtasks /run /tn \"{task_name}\"")
    else:
        print(f"❌ Erro ao criar tarefa:")
        print(f"   {result.stderr}")
        if 'Access is denied' in result.stderr or 'acesso' in result.stderr.lower():
            print(f"\n💡 Tente executar como Administrador:")
            print(f"   Abra o PowerShell como Admin e execute:")
            print(f"   python setup_scheduler.py")


def remove_scheduled_task(task_name: str = 'BlogAutoPost'):
    """Remove a tarefa agendada."""
    result = subprocess.run(
        ['schtasks', '/delete', '/tn', task_name, '/f'],
        capture_output=True, text=True
    )
    
    if result.returncode == 0:
        print(f"✅ Tarefa '{task_name}' removida com sucesso!")
    else:
        print(f"❌ Erro ao remover tarefa: {result.stderr}")


def check_scheduled_task(task_name: str = 'BlogAutoPost'):
    """Verifica status da tarefa agendada."""
    result = subprocess.run(
        ['schtasks', '/query', '/tn', task_name, '/v', '/fo', 'list'],
        capture_output=True, text=True
    )
    
    if result.returncode == 0:
        print(f"📋 Status da tarefa '{task_name}':")
        print(result.stdout)
    else:
        print(f"❌ Tarefa '{task_name}' não encontrada.")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Gerencia agendamento do Blog Auto Post')
    parser.add_argument('action', choices=['create', 'remove', 'check'],
                       default='create', nargs='?',
                       help='Ação: create, remove ou check')
    parser.add_argument('--time', default='09:00',
                       help='Horário de execução (HH:MM)')
    parser.add_argument('--name', default='BlogAutoPost',
                       help='Nome da tarefa')
    
    args = parser.parse_args()
    
    if args.action == 'create':
        create_scheduled_task(task_name=args.name, time=args.time)
    elif args.action == 'remove':
        remove_scheduled_task(task_name=args.name)
    elif args.action == 'check':
        check_scheduled_task(task_name=args.name)
