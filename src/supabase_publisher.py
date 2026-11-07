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


def condense_lead_excerpt(text: str, min_len: int = 120, max_len: int = 160) -> str:
    """
    Formata a Linha Fina (excerpt) e Meta Description entre 120 e 160 caracteres
    em 1 a 2 frases curtas sem cortar palavras ao meio.
    """
    clean = re.sub(r'<[^>]*>', ' ', text or '').strip()
    clean = re.sub(r'\s+', ' ', clean)
    if not clean:
        return ''
    if len(clean) <= max_len:
        return clean

    sentences = re.split(r'(?<=[.!?])\s+', clean)
    if sentences:
        first = sentences[0].strip()
        if 85 <= len(first) <= 165:
            return first
        if len(sentences) > 1:
            two = f"{first} {sentences[1].strip()}"
            if len(two) <= 165:
                return two

    sub = clean[:max_len]
    for sep in ('; ', ', ', ' — '):
        idx = sub.rfind(sep)
        if idx >= min_len - 15:
            return sub[:idx].strip().rstrip('.,;:') + '.'

    last_space = sub.rfind(' ')
    if last_space > 80:
        cut = sub[:last_space].rstrip('.,;:-–— ')
        return cut if cut.endswith('.') else cut + '.'
    return clean[:max_len - 3].strip() + '...'


def calculate_reading_time(text: str) -> str:
    """Calcula o tempo estimado de leitura em minutos."""
    # Remove tags HTML
    clean_text = re.sub(r'<[^>]*>', '', text)
    word_count = len(clean_text.split())
    minutes = max(1, (word_count + 199) // 200)
    return f"{minutes} min de leitura"


class SupabasePublisher:
    """Cliente para publicação de matérias no Supabase."""

    def __init__(self, url: str, key: str, portal_base_url: str = "https://umfuturoproximo.com.br"):
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

    def publish_article(self, data: Dict[str, Any], preserve_dates: bool = False) -> Optional[Dict[str, Any]]:
        """
        Publica ou atualiza um artigo no Supabase.

        Args:
            data: Dicionário contendo os dados do artigo
            preserve_dates: Se True e o artigo já existir, mantém published_at e created_at originais do banco

        Returns:
            Dicionário com os dados do artigo criado/atualizado e a URL pública
        """
        title = data.get('title', '').strip()
        if not title:
            logger.error("Não é possível publicar artigo sem título.")
            return None

        slug = data.get('slug') or slugify(title)
        content = data.get('content', '').strip()
        raw_excerpt = re.sub(r'<[^>]*>', '', (data.get('excerpt') or '')).strip()
        if not raw_excerpt and content:
            clean_body = re.sub(r'<ul[^>]*data-highlights[^>]*>[\s\S]*?</ul>', ' ', content, flags=re.I)
            clean_body = re.sub(r'<[^>]*>', ' ', clean_body).strip()
            raw_excerpt = re.sub(r'\s+', ' ', clean_body)
        excerpt = condense_lead_excerpt(raw_excerpt, 120, 160)

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

        if data.get('published_at'):
            payload['published_at'] = data['published_at']
        if data.get('created_at'):
            payload['created_at'] = data['created_at']

        # 1. Verifica se o artigo com este slug já existe
        check_url = f"{self.url}/rest/v1/articles?slug=eq.{slug}&select=id,slug,published_at,created_at,image_url,is_featured"
        try:
            check_res = requests.get(check_url, headers=self.headers, timeout=10)
            existing = check_res.json() if check_res.status_code == 200 else []

            if existing and len(existing) > 0:
                # Atualiza o artigo existente (PATCH)
                curr = existing[0]
                art_id = curr['id']
                if preserve_dates:
                    payload.pop('published_at', None)
                    payload.pop('created_at', None)
                if not payload.get('image_url') and curr.get('image_url'):
                    payload['image_url'] = curr['image_url']
                if curr.get('is_featured'):
                    payload['is_featured'] = True

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
