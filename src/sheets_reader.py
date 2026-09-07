"""
Leitor de Google Sheets para notícias de IA.

Lê dados da planilha, filtra notícias pendentes e marca como publicadas.
Estrutura da planilha:
  A: Data de Inclusão
  B: Título
  C: Matéria (resumo/conteúdo)
  D: Link
  E: Status (gerenciado pelo sistema)
"""

import logging
from typing import Optional
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

logger = logging.getLogger(__name__)


class SheetsReader:
    """Cliente para leitura e atualização da planilha Google Sheets."""
    
    def __init__(self, credentials: Credentials, spreadsheet_id: str,
                 sheet_name: str = 'Sheet1'):
        """
        Inicializa o leitor de planilhas.
        Auto-detecta o nome real da aba se o configurado não existir.

        Args:
            credentials: Credenciais OAuth2 válidas
            spreadsheet_id: ID da planilha no Google Sheets
            sheet_name: Nome da aba da planilha (será auto-detectado se inválido)
        """
        self.spreadsheet_id = spreadsheet_id
        self.service = build('sheets', 'v4', credentials=credentials)
        self.sheets = self.service.spreadsheets()
        self.sheet_name = self._resolve_sheet_name(sheet_name)

    def _resolve_sheet_name(self, preferred: str) -> str:
        """
        Descobre o nome real da aba na planilha.
        Se o nome preferido não existir, usa a primeira aba disponível.

        Args:
            preferred: Nome preferido da aba (ex: 'Sheet1')

        Returns:
            Nome real da aba encontrada
        """
        try:
            meta = self.sheets.get(
                spreadsheetId=self.spreadsheet_id,
                fields='sheets.properties.title'
            ).execute()
            sheet_titles = [
                s['properties']['title']
                for s in meta.get('sheets', [])
            ]
            logger.info("Abas encontradas na planilha: %s", sheet_titles)

            if preferred in sheet_titles:
                logger.info("Usando aba configurada: '%s'", preferred)
                return preferred

            # Fallback: usa a primeira aba
            first = sheet_titles[0] if sheet_titles else preferred
            logger.warning(
                "Aba '%s' não encontrada. Usando a primeira aba disponível: '%s'",
                preferred, first
            )
            return first
        except Exception as e:
            logger.warning("Não foi possível detectar nome da aba: %s. Usando '%s'.", e, preferred)
            return preferred
    
    def get_pending_news(self, max_items: int = 10) -> list[dict]:
        """
        Lê notícias pendentes (não publicadas) da planilha.
        
        Args:
            max_items: Número máximo de itens a retornar
            
        Returns:
            Lista de dicionários com dados das notícias pendentes
        """
        try:
            range_name = f"{self.sheet_name}!A:E"
            result = self.sheets.values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                valueRenderOption='FORMATTED_VALUE'
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                logger.info("Planilha vazia. Nenhuma notícia encontrada.")
                return []
            
            # Primeira linha é cabeçalho
            header = values[0] if values else []
            logger.info("Cabeçalho encontrado: %s", header)
            
            pending_news = []
            for row_idx, row in enumerate(values[1:], start=2):  # start=2 porque row 1 é header
                # Preenche colunas faltantes com string vazia
                while len(row) < 5:
                    row.append('')
                
                date_str = row[0].strip() if row[0] else ''
                title = row[1].strip() if row[1] else ''
                content = row[2].strip() if row[2] else ''
                link = row[3].strip() if row[3] else ''
                status = row[4].strip().lower() if row[4] else ''
                
                # Pula linhas sem título
                if not title:
                    continue
                
                # Pula linhas já publicadas
                if status in ('sim', 'publicado', 'published', 'erro'):
                    continue
                
                pending_news.append({
                    'row_number': row_idx,
                    'date': date_str,
                    'title': title,
                    'content': content,
                    'link': link,
                    'status': status,
                })
                
                if len(pending_news) >= max_items:
                    break
            
            logger.info("Encontradas %d notícias pendentes (máximo: %d)", 
                       len(pending_news), max_items)
            return pending_news
            
        except Exception as e:
            logger.error("Erro ao ler planilha: %s", e)
            raise
    
    def mark_as_published(self, row_number: int, post_url: str = '') -> bool:
        """
        Marca uma notícia como publicada na planilha.

        Coluna E (Blogger):    "Sim"
        Coluna F (BloggerUrl): URL do post no Blogger

        Args:
            row_number: Número da linha na planilha (1-indexed)
            post_url: URL do post publicado no Blogger

        Returns:
            True se a atualização foi bem-sucedida
        """
        try:
            # Atualiza E (Blogger=Sim) e F (BloggerUrl) em um único batch
            data = [
                {
                    'range': f"{self.sheet_name}!E{row_number}",
                    'values': [['Sim']]
                },
                {
                    'range': f"{self.sheet_name}!F{row_number}",
                    'values': [[post_url]]
                },
            ]
            body = {
                'valueInputOption': 'USER_ENTERED',
                'data': data
            }
            self.sheets.values().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body=body
            ).execute()

            logger.info(
                "Linha %d marcada: Blogger=Sim | BloggerUrl=%s",
                row_number, post_url
            )
            
            return True
            
        except Exception as e:
            logger.error("Erro ao marcar linha %d como publicada: %s", row_number, e)
            return False
    
    def mark_as_error(self, row_number: int, error_msg: str = '') -> bool:
        """
        Marca uma notícia com erro na planilha.
        
        Args:
            row_number: Número da linha na planilha
            error_msg: Mensagem de erro
            
        Returns:
            True se a atualização foi bem-sucedida
        """
        try:
            range_name = f"{self.sheet_name}!E{row_number}"
            status_text = f"Erro: {error_msg[:50]}" if error_msg else "Erro"
            body = {
                'values': [[status_text]]
            }
            
            self.sheets.values().update(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            
            logger.warning("Linha %d marcada como erro: %s", row_number, status_text)
            return True
            
        except Exception as e:
            logger.error("Erro ao marcar linha %d com erro: %s", row_number, e)
            return False
