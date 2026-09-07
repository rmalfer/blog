"""
Cliente para Blogger API v3.

Publica posts no Blogger usando a API oficial do Google.
"""

import logging
from typing import Optional
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

logger = logging.getLogger(__name__)


class BloggerClient:
    """Cliente para publicação no Blogger via API v3."""
    
    def __init__(self, credentials: Credentials, blog_id: str):
        """
        Inicializa o cliente Blogger.
        
        Args:
            credentials: Credenciais OAuth2 válidas
            blog_id: ID do blog no Blogger
        """
        self.blog_id = blog_id
        self.service = build('blogger', 'v3', credentials=credentials)
    
    def list_blogs(self) -> list[dict]:
        """
        Lista todos os blogs do usuário autenticado.
        
        Returns:
            Lista de dicionários com informações dos blogs
        """
        try:
            result = self.service.blogs().listByUser(userId='self').execute()
            blogs = result.get('items', [])
            
            for blog in blogs:
                logger.info(
                    "Blog encontrado: '%s' (ID: %s) - %s",
                    blog.get('name'), blog.get('id'), blog.get('url')
                )
            
            return blogs
            
        except Exception as e:
            logger.error("Erro ao listar blogs: %s", e)
            raise
    
    def get_blog_info(self) -> Optional[dict]:
        """
        Obtém informações do blog configurado.
        
        Returns:
            Dicionário com informações do blog ou None
        """
        try:
            blog = self.service.blogs().get(blogId=self.blog_id).execute()
            logger.info(
                "Blog: '%s' - %s (Total de posts: %s)",
                blog.get('name'), blog.get('url'),
                blog.get('posts', {}).get('totalItems', 0)
            )
            return blog
        except Exception as e:
            logger.error("Erro ao obter informações do blog %s: %s", self.blog_id, e)
            return None
    
    def create_post(self, post_data: dict, is_draft: bool = False) -> Optional[dict]:
        """
        Cria um novo post no Blogger.
        
        Args:
            post_data: Dicionário com dados do post (title, content, labels)
            is_draft: Se True, cria como rascunho; se False, publica diretamente
            
        Returns:
            Dicionário com dados do post criado (incluindo URL) ou None
        """
        try:
            title = post_data.get('title', 'Sem título')
            logger.info(
                "Publicando post: '%s' (rascunho: %s)",
                title, is_draft
            )
            
            result = self.service.posts().insert(
                blogId=self.blog_id,
                body=post_data,
                isDraft=is_draft,
                fetchBody=False,  # Não precisa retornar o body completo
                fetchImages=False
            ).execute()
            
            post_url = result.get('url', '')
            post_id = result.get('id', '')
            status = result.get('status', 'UNKNOWN')
            
            logger.info(
                "Post criado com sucesso! ID: %s | Status: %s | URL: %s",
                post_id, status, post_url
            )
            
            return result
            
        except Exception as e:
            logger.error("Erro ao criar post '%s': %s", post_data.get('title'), e)
            return None
    
    def get_recent_posts(self, max_results: int = 5) -> list[dict]:
        """
        Lista posts recentes do blog.
        
        Args:
            max_results: Número máximo de posts a retornar
            
        Returns:
            Lista de posts recentes
        """
        try:
            result = self.service.posts().list(
                blogId=self.blog_id,
                maxResults=max_results,
                fetchBodies=False,
                orderBy='PUBLISHED'
            ).execute()
            
            posts = result.get('items', [])
            logger.info("Encontrados %d posts recentes", len(posts))
            return posts
            
        except Exception as e:
            logger.error("Erro ao listar posts recentes: %s", e)
            return []
