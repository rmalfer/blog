"""
Buscador de imagem principal de notícias.

Extrai a imagem principal de um link de notícia usando
Open Graph, Twitter Card ou primeira imagem relevante no HTML.
"""

import logging
import requests
from typing import Optional
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

# Headers para simular navegador e evitar bloqueios
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
}


def fetch_main_image(url: str, timeout: int = 10) -> Optional[str]:
    """
    Busca a URL da imagem principal de uma página de notícia.

    Tenta na ordem:
    1. Meta tag og:image (Open Graph)
    2. Meta tag twitter:image
    3. Meta tag og:image:secure_url
    4. Primeira <img> com dimensões significativas (width >= 300)

    Args:
        url: URL da notícia
        timeout: Timeout em segundos para a requisição

    Returns:
        URL absoluta da imagem encontrada, ou None se não encontrar
    """
    if not url or not url.startswith('http'):
        logger.debug("URL inválida para busca de imagem: %s", url)
        return None

    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout,
                                allow_redirects=True)
        response.raise_for_status()
        html = response.text
        base_url = response.url  # URL final após redirects

    except requests.Timeout:
        logger.warning("Timeout ao buscar imagem de: %s", url)
        return None
    except requests.RequestException as e:
        logger.warning("Erro ao acessar '%s': %s", url, e)
        return None

    # Tenta extrair com BeautifulSoup se disponível, senão usa regex simples
    try:
        from bs4 import BeautifulSoup
        return _extract_with_bs4(html, base_url)
    except ImportError:
        return _extract_with_regex(html, base_url)


def _extract_with_bs4(html: str, base_url: str) -> Optional[str]:
    """Extrai imagem usando BeautifulSoup."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, 'html.parser')

    # 1. og:image
    og_image = soup.find('meta', property='og:image')
    if og_image and og_image.get('content'):
        img_url = og_image['content'].strip()
        if img_url:
            return _make_absolute(img_url, base_url)

    # 2. og:image:secure_url
    og_secure = soup.find('meta', property='og:image:secure_url')
    if og_secure and og_secure.get('content'):
        img_url = og_secure['content'].strip()
        if img_url:
            return _make_absolute(img_url, base_url)

    # 3. twitter:image
    tw_image = soup.find('meta', attrs={'name': 'twitter:image'})
    if not tw_image:
        tw_image = soup.find('meta', property='twitter:image')
    if tw_image and tw_image.get('content'):
        img_url = tw_image['content'].strip()
        if img_url:
            return _make_absolute(img_url, base_url)

    # 4. Primeira img com width >= 300 ou sem width definido (exclui ícones/logos pequenos)
    for img in soup.find_all('img', src=True):
        src = img.get('src', '').strip()
        if not src or src.startswith('data:'):
            continue
        # Pula imagens claramente pequenas
        width = img.get('width', '')
        try:
            if width and int(width) < 300:
                continue
        except (ValueError, TypeError):
            pass
        # Pula URLs com padrões de ícone/avatar/logo
        lower = src.lower()
        if any(p in lower for p in ['icon', 'logo', 'avatar', 'sprite', 'pixel', '1x1']):
            continue
        abs_url = _make_absolute(src, base_url)
        if abs_url:
            return abs_url

    logger.debug("Nenhuma imagem encontrada em: %s", base_url)
    return None


def _extract_with_regex(html: str, base_url: str) -> Optional[str]:
    """Extrai imagem usando regex (fallback quando bs4 não está disponível)."""
    import re

    # og:image
    match = re.search(
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    )
    if not match:
        match = re.search(
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            html, re.IGNORECASE
        )
    if match:
        return _make_absolute(match.group(1).strip(), base_url)

    # twitter:image
    match = re.search(
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE
    )
    if match:
        return _make_absolute(match.group(1).strip(), base_url)

    return None


def _make_absolute(url: str, base_url: str) -> Optional[str]:
    """Converte URL relativa em absoluta e valida protocolo http/https."""
    if not url:
        return None
    url = url.strip()
    # Ignora protocolos inválidos (ex: printable://, data:, javascript:, file:)
    if ':' in url and not url.startswith(('http://', 'https://', '//')):
        logger.debug("Protocolo de imagem invalido descartado: %s", url[:30])
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
