"""
Buscador e hospedador local de imagens principais de matérias.

Extrai a imagem de referência, bloqueia domínios com marca d'água/overlay de jornais,
converte e salva localmente em public/images/articles/<slug>.webp (hospedado no domínio
próprio via CDN da Vercel), com fallback para capas editoriais hospedadas por categoria.
"""

import hashlib
import io
import logging
from pathlib import Path
import requests
from typing import Optional
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
ARTICLES_IMG_DIR = BASE_DIR / 'public' / 'images' / 'articles'

# Headers para simular navegador e evitar bloqueios
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
}

# Domínios que aplicam marca d'água, overlay de jornal ou retornam placeholders genéricos
BLOCKED_IMAGE_DOMAINS = (
    'i.guim.co.uk',
    'ichef.bbci.co.uk',
    'static01.nyt.com',
    'en.people.cn',
    'aitoolsrecap.com',
    'static.toiimg.com',
    'globaltimes.cn',
    'militarnyi.com',
)

HOSTED_CATEGORY_COVERS = {
    'inteligencia-artificial': [
        '/images/covers/inteligencia-artificial-1.webp',
        '/images/covers/inteligencia-artificial-2.webp',
        '/images/covers/inteligencia-artificial-3.webp',
    ],
    'robos-humanoides': [
        '/images/covers/robos-humanoides-1.webp',
        '/images/covers/robos-humanoides-2.webp',
        '/images/covers/robos-humanoides-3.webp',
    ],
    'saude-biotec': [
        '/images/covers/saude-biotec-1.webp',
        '/images/covers/saude-biotec-2.webp',
        '/images/covers/saude-biotec-3.webp',
    ],
    'startups-futuro': [
        '/images/covers/startups-futuro-1.webp',
        '/images/covers/startups-futuro-2.webp',
        '/images/covers/startups-futuro-3.webp',
    ],
}


def is_blocked_image_url(img_url: str) -> bool:
    """Verifica se a URL pertence a um domínio bloqueado ou possui overlay/watermark."""
    if not img_url:
        return True
    lower = img_url.lower()
    if any(marker in lower for marker in ('overlay-base64', 'watermark', 'default_article', 'tit0.png')):
        return True
    host = urlparse(img_url).netloc.lower()
    return any(blocked in host for blocked in BLOCKED_IMAGE_DOMAINS)


def get_hosted_category_cover(category_slug: str, slug: str = '') -> str:
    """Retorna uma capa editorial hospedada no domínio próprio de forma determinística pelo slug."""
    covers = HOSTED_CATEGORY_COVERS.get(
        category_slug,
        HOSTED_CATEGORY_COVERS['inteligencia-artificial']
    )
    if not slug:
        return covers[0]
    idx = int(hashlib.md5(slug.encode('utf-8')).hexdigest(), 16) % len(covers)
    return covers[idx]


def download_and_host_image(
    image_url: str,
    slug: str,
    category_slug: str = 'inteligencia-artificial',
    timeout: int = 10
) -> str:
    """
    Baixa uma imagem externa válida, otimiza para WebP (1200x675) em
    public/images/articles/<slug>.webp e retorna o caminho hospedado (/images/...).
    Em caso de domínio bloqueado ou erro, retorna uma capa editorial própria hospedada.
    """
    if not image_url or is_blocked_image_url(image_url):
        return get_hosted_category_cover(category_slug, slug)

    # Se já é uma imagem hospedada no próprio portal, mantém
    if image_url.startswith('/images/') or 'umfuturoproximo.com.br/images/' in image_url:
        return image_url

    try:
        resp = requests.get(image_url, headers=HEADERS, timeout=timeout, stream=True)
        resp.raise_for_status()
        content_type = resp.headers.get('Content-Type', '').lower()
        if 'image' not in content_type:
            return get_hosted_category_cover(category_slug, slug)

        raw = resp.content
        if len(raw) < 8_000 or len(raw) > 8_000_000:
            return get_hosted_category_cover(category_slug, slug)

        from PIL import Image, ImageOps
        img = Image.open(io.BytesIO(raw))
        if img.width < 400 or img.height < 220:
            return get_hosted_category_cover(category_slug, slug)

        img = img.convert('RGB')
        img = ImageOps.fit(img, (1200, 675), method=Image.Resampling.LANCZOS)

        ARTICLES_IMG_DIR.mkdir(parents=True, exist_ok=True)
        safe_slug = ''.join(c for c in slug if c.isalnum() or c in ('-', '_'))[:80] or 'artigo'
        dest = ARTICLES_IMG_DIR / f"{safe_slug}.webp"
        img.save(dest, format='WEBP', quality=82, method=6)
        logger.info("Imagem hospedada localmente: %s", dest)
        return f"/images/articles/{safe_slug}.webp"

    except Exception as e:
        logger.warning("Não foi possível hospedar imagem '%s': %s. Usando capa editorial.", image_url[:80], e)
        return get_hosted_category_cover(category_slug, slug)


def fetch_main_image(
    url: str,
    timeout: int = 10,
    slug: str = '',
    category_slug: str = 'inteligencia-artificial',
    host_locally: bool = True
) -> Optional[str]:
    """
    Busca a URL da imagem principal de uma página de notícia e, por padrão,
    hospeda a versão otimizada no domínio próprio (ou usa capa editorial hospedada).
    """
    if not url or not url.startswith('http'):
        return get_hosted_category_cover(category_slug, slug) if host_locally else None

    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        response.raise_for_status()
        html = response.text
        base_url = response.url
    except requests.RequestException as e:
        logger.warning("Erro ao acessar '%s': %s", url, e)
        return get_hosted_category_cover(category_slug, slug) if host_locally else None

    try:
        from bs4 import BeautifulSoup
        extracted = _extract_with_bs4(html, base_url)
    except ImportError:
        extracted = _extract_with_regex(html, base_url)

    if host_locally:
        if extracted and not is_blocked_image_url(extracted) and slug:
            return download_and_host_image(extracted, slug=slug, category_slug=category_slug, timeout=timeout)
        return get_hosted_category_cover(category_slug, slug)

    if extracted and is_blocked_image_url(extracted):
        return None
    return extracted


def _extract_with_bs4(html: str, base_url: str) -> Optional[str]:
    """Extrai imagem usando BeautifulSoup."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, 'html.parser')

    og_image = soup.find('meta', property='og:image')
    if og_image and og_image.get('content'):
        img_url = _make_absolute(og_image['content'].strip(), base_url)
        if img_url and not is_blocked_image_url(img_url):
            return img_url

    og_secure = soup.find('meta', property='og:image:secure_url')
    if og_secure and og_secure.get('content'):
        img_url = _make_absolute(og_secure['content'].strip(), base_url)
        if img_url and not is_blocked_image_url(img_url):
            return img_url

    tw_image = soup.find('meta', attrs={'name': 'twitter:image'}) or soup.find('meta', property='twitter:image')
    if tw_image and tw_image.get('content'):
        img_url = _make_absolute(tw_image['content'].strip(), base_url)
        if img_url and not is_blocked_image_url(img_url):
            return img_url

    for img in soup.find_all('img', src=True):
        src = img.get('src', '').strip()
        if not src or src.startswith('data:'):
            continue
        width = img.get('width', '')
        try:
            if width and int(width) < 300:
                continue
        except (ValueError, TypeError):
            pass
        lower = src.lower()
        if any(p in lower for p in ['icon', 'logo', 'avatar', 'sprite', 'pixel', '1x1']):
            continue
        abs_url = _make_absolute(src, base_url)
        if abs_url and not is_blocked_image_url(abs_url):
            return abs_url

    return None


def _extract_with_regex(html: str, base_url: str) -> Optional[str]:
    """Extrai imagem usando regex (fallback quando bs4 não está disponível)."""
    import re

    match = re.search(
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    ) or re.search(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        html, re.IGNORECASE
    )
    if match:
        img_url = _make_absolute(match.group(1).strip(), base_url)
        if img_url and not is_blocked_image_url(img_url):
            return img_url

    match = re.search(
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    )
    if match:
        img_url = _make_absolute(match.group(1).strip(), base_url)
        if img_url and not is_blocked_image_url(img_url):
            return img_url

    return None


def _make_absolute(url: str, base_url: str) -> Optional[str]:
    """Converte URL relativa em absoluta e valida protocolo http/https."""
    if not url:
        return None
    url = url.strip()
    if ':' in url and not url.startswith(('http://', 'https://', '//')):
        return None
    if url.startswith('//'):
        parsed = urlparse(base_url)
        return f"{parsed.scheme or 'https'}:{url}"
    if url.startswith(('http://', 'https://')):
        return url
    full_url = urljoin(base_url, url)
    if full_url.startswith(('http://', 'https://')):
        return full_url
    return None
