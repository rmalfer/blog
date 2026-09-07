"""
Publicador de Notícias para Supabase REST API.

Insere e atualiza artigos na tabela 'articles' do Supabase.
Autor oficial: Riccardo Malfer
"""

import logging
import re
import unicodedata
import requests
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def slugify(text: str) -> str:
    """Gera um slug limpo e compatível com URLs a partir do título."""
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text.lower())
    slug = re.sub(r'[-\s]+', '-', text).strip('-')
    return slug[:100]


def calculate_reading_time(text: str) -> str:
    """Calcula o tempo estimado de leitura em minutos."""
    # Remove tags HTML
    clean_text = re.sub(r'<[^>]*>', '', text)
    word_count = len(clean_text.split())
    minutes = max(1, (word_count + 199) // 200)
    return f"{minutes} min de leitura"


class SupabasePublisher:
    """Cliente para publicação de matérias no Supabase."""

    def __init__(self, url: str, key: str, portal_base_url: str = "https://umfuturoproximo.vercel.app"):
        """
        Inicializa o publicador do Supabase.

        Args:
            url: URL do projeto Supabase (ex: https://xyz.supabase.co)
            key: Chave de API (service_role ou publishable)
            portal_base_url: URL base do portal para retorno de link público
        """
        self.url = url.rstrip('/')
        self.key = key
        self.portal_base_url = portal_base_url.rstrip('/')
        self.headers = {
            'apikey': self.key,
            'Authorization': f'Bearer {self.key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

    def test_connection(self) -> bool:
        """Testa se a API do Supabase está acessível com a chave configurada."""
        try:
            res = requests.get(
                f"{self.url}/rest/v1/categories?select=id,name&limit=1",
                headers=self.headers,
                timeout=10
            )
            if res.status_code in (200, 206):
                logger.info("✅ Conexão com Supabase OK (status %d)", res.status_code)
                return True
            else:
                logger.warning("⚠️ Supabase retornou status %d: %s", res.status_code, res.text)
                return False
        except Exception as e:
            logger.error("❌ Falha na conexão com Supabase: %s", e)
            return False

    def publish_article(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Publica ou atualiza um artigo no Supabase.

        Args:
            data: Dicionário contendo os dados do artigo

        Returns:
            Dicionário com os dados do artigo criado/atualizado e a URL pública
        """
        title = data.get('title', '').strip()
        if not title:
            logger.error("Não é possível publicar artigo sem título.")
            return None

        slug = data.get('slug') or slugify(title)
        content = data.get('content', '').strip()
        excerpt = data.get('excerpt', '')
        if not excerpt and content:
            # Extrai os primeiros 200 caracteres de texto limpo para o excerpt
            clean = re.sub(r'<[^>]*>', '', content).strip()
            excerpt = clean[:220] + '...' if len(clean) > 220 else clean

        reading_time = data.get('reading_time') or calculate_reading_time(content)

        payload = {
            'title': title,
            'slug': slug,
            'excerpt': excerpt,
            'content': content,
            'category_name': data.get('category_name', 'Inteligência Artificial'),
            'category_slug': data.get('category_slug', 'inteligencia-artificial'),
            'image_url': data.get('image_url') or None,
            'source_url': data.get('source_url') or None,
            'author_name': 'Riccardo Malfer',
            'author_role': 'Editor & Especialista em IA',
            'status': data.get('status', 'published'),
            'is_featured': data.get('is_featured', False),
            'reading_time': reading_time,
            'sheet_source': data.get('sheet_source'),
            'sheet_row': data.get('sheet_row'),
        }

        # 1. Verifica se o artigo com este slug já existe
        check_url = f"{self.url}/rest/v1/articles?slug=eq.{slug}&select=id,slug"
        try:
            check_res = requests.get(check_url, headers=self.headers, timeout=10)
            existing = check_res.json() if check_res.status_code == 200 else []

            if existing and len(existing) > 0:
                # Atualiza o artigo existente (PATCH)
                art_id = existing[0]['id']
                logger.info("Artigo '%s' já existe. Atualizando ID: %s", slug, art_id)
                patch_url = f"{self.url}/rest/v1/articles?id=eq.{art_id}"
                patch_res = requests.patch(patch_url, json=payload, headers=self.headers, timeout=15)
                patch_res.raise_for_status()
                post_url = f"{self.portal_base_url}/noticia/{slug}"
                return {'id': art_id, 'slug': slug, 'url': post_url, 'action': 'updated'}

            # 2. Insere novo artigo (POST)
            insert_url = f"{self.url}/rest/v1/articles"
            insert_res = requests.post(insert_url, json=payload, headers=self.headers, timeout=15)
            insert_res.raise_for_status()

            created = insert_res.json() if insert_res.text else [{}]
            art_id = created[0].get('id') if isinstance(created, list) and len(created) > 0 else 'created'
            post_url = f"{self.portal_base_url}/noticia/{slug}"
            logger.info("✅ Artigo publicado com sucesso: %s", post_url)

            return {'id': art_id, 'slug': slug, 'url': post_url, 'action': 'inserted'}

        except requests.HTTPError as he:
            logger.error("Erro HTTP ao publicar no Supabase: %s - %s", he, he.response.text if he.response else '')
            return None
        except Exception as e:
            logger.error("Erro ao publicar artigo no Supabase: %s", e)
            return None
