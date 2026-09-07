"""
Gerenciador de Autenticação OAuth2 para Google APIs.

Gerencia tokens OAuth2 para acesso ao Google Sheets e Blogger API.
Usa o fluxo de loopback local (InstalledAppFlow) para desktop apps.
"""

import os
import logging
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

logger = logging.getLogger(__name__)

# Escopos necessários: leitura/escrita no Sheets (para marcar status) + Blogger
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',  # Read/Write para marcar publicados
    'https://www.googleapis.com/auth/blogger',        # Read/Write para publicar posts
]

# Caminhos padrão
BASE_DIR = Path(__file__).resolve().parent.parent
CLIENT_SECRET_FILE = BASE_DIR / 'config' / 'client_secret.json'
TOKEN_FILE = BASE_DIR / 'data' / 'token.json'


def get_credentials(client_secret_path: str = None, token_path: str = None) -> Credentials:
    """
    Obtém credenciais OAuth2 válidas.
    
    Na primeira execução, abre o navegador para autorização.
    Nas execuções seguintes, usa o token salvo e faz refresh automático.
    
    Args:
        client_secret_path: Caminho para o arquivo client_secret.json
        token_path: Caminho para salvar/ler o token
        
    Returns:
        Credentials válidas para uso nas APIs Google
    """
    client_secret = Path(client_secret_path) if client_secret_path else CLIENT_SECRET_FILE
    token_file = Path(token_path) if token_path else TOKEN_FILE
    
    creds = None
    
    # Tenta carregar token existente
    if token_file.exists():
        logger.info("Carregando token existente de %s", token_file)
        try:
            creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)
        except Exception as e:
            logger.warning("Erro ao carregar token: %s. Será necessário re-autenticar.", e)
            creds = None
    
    # Se não tem credenciais válidas, precisa autenticar
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            logger.info("Token expirado. Fazendo refresh...")
            try:
                creds.refresh(Request())
                logger.info("Token renovado com sucesso.")
            except Exception as e:
                logger.warning("Erro ao renovar token: %s. Re-autenticando...", e)
                creds = None
        
        if not creds:
            if not client_secret.exists():
                raise FileNotFoundError(
                    f"Arquivo de credenciais não encontrado: {client_secret}\n"
                    f"Coloque o arquivo client_secret.json em {client_secret.parent}"
                )
            
            logger.info("Iniciando fluxo de autenticação OAuth2...")
            logger.info("Um navegador será aberto para autorização.")
            
            flow = InstalledAppFlow.from_client_secrets_file(
                str(client_secret), SCOPES
            )
            creds = flow.run_local_server(
                port=0,  # Porta automática
                prompt='consent',
                authorization_prompt_message='Abrindo navegador para autorização...',
                success_message='Autenticação concluída! Pode fechar esta aba.'
            )
            logger.info("Autenticação concluída com sucesso.")
        
        # Salva o token para uso futuro
        token_file.parent.mkdir(parents=True, exist_ok=True)
        with open(token_file, 'w') as f:
            f.write(creds.to_json())
        logger.info("Token salvo em %s", token_file)
    
    return creds


def revoke_credentials(token_path: str = None) -> bool:
    """
    Revoga as credenciais OAuth2 salvas.
    
    Args:
        token_path: Caminho do arquivo de token
        
    Returns:
        True se revogou com sucesso
    """
    token_file = Path(token_path) if token_path else TOKEN_FILE
    
    if token_file.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)
            if creds and creds.valid:
                from google.auth.transport.requests import Request as AuthRequest
                import requests
                requests.post(
                    'https://oauth2.googleapis.com/revoke',
                    params={'token': creds.token},
                    headers={'content-type': 'application/x-www-form-urlencoded'}
                )
            token_file.unlink()
            logger.info("Credenciais revogadas e token removido.")
            return True
        except Exception as e:
            logger.error("Erro ao revogar credenciais: %s", e)
            return False
    else:
        logger.info("Nenhum token encontrado para revogar.")
        return False
