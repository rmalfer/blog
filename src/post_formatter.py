"""
Formatador de posts para Blogger.

Converte dados de notícias em HTML formatado para publicação no Blogger.
Inclui imagem principal no topo e link da fonte no final.
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Template HTML completo do post
POST_TEMPLATE = """\
<div class="ai-news-post">

    {image_section}

    <div class="post-content" style="line-height: 1.7; color: #333; font-size: 1em;">
        {content}
    </div>

    {source_section}

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    <p style="font-size: 0.82em; color: #999; font-style: italic; margin: 0;">
        &#9997;&#65039; Publicado por Riccardo Malfer | {publish_date}
    </p>

</div>"""

# Bloco de imagem principal
IMAGE_TEMPLATE = """\
<div class="post-featured-image" style="margin-bottom: 24px; text-align: center;">
    <img src="{image_url}"
         alt="{title}"
         style="max-width: 100%; width: 100%; height: auto; max-height: 420px;
                object-fit: cover; border-radius: 8px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.12);"
         onerror="this.style.display='none'">
</div>"""

# Bloco de fonte
SOURCE_TEMPLATE = """\
<div class="post-source" style="margin-top: 28px; padding: 14px 18px;
     background-color: #f0f4ff; border-left: 4px solid #1a73e8;
     border-radius: 0 6px 6px 0;">
    <p style="margin: 0 0 4px 0; font-size: 0.88em; color: #555; font-weight: 600;
              text-transform: uppercase; letter-spacing: 0.05em;">
        &#128279; Fonte Original
    </p>
    <a href="{link}" target="_blank" rel="noopener noreferrer"
       style="font-size: 0.92em; color: #1a73e8; word-break: break-all;
              text-decoration: none;">
        {link}
    </a>
</div>"""


class PostFormatter:
    """Formatador de conteúdo para posts no Blogger."""

    def __init__(self, default_labels: list[str] = None):
        """
        Inicializa o formatador.

        Args:
            default_labels: Labels padrão para todos os posts
        """
        self.default_labels = default_labels or ['Inteligência Artificial', 'Tecnologia']

    def format_post(self, title: str, content: str, link: str = '',
                    image_url: str = '', labels: list[str] = None) -> dict:
        """
        Formata uma notícia como post para o Blogger.

        Args:
            title: Título do post
            content: Conteúdo HTML do post (gerado pelo Ollama ou da planilha)
            link: Link da fonte original
            image_url: URL da imagem principal (Open Graph / og:image)
            labels: Labels/tags do post

        Returns:
            Dicionário com dados formatados para a API do Blogger
        """
        # Garante que o conteúdo está em HTML
        formatted_content = self._ensure_html(content)

        # Bloco de imagem (topo do post)
        image_section = ''
        if image_url:
            safe_title = title.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
            image_section = IMAGE_TEMPLATE.format(
                image_url=image_url,
                title=safe_title
            )
            logger.info("Imagem incluída no post: %s", image_url)

        # Bloco de fonte (rodapé do post)
        source_section = ''
        if link:
            source_section = SOURCE_TEMPLATE.format(link=link)

        # Monta o HTML final
        html_body = POST_TEMPLATE.format(
            image_section=image_section,
            content=formatted_content,
            source_section=source_section,
            publish_date=datetime.now().strftime('%d/%m/%Y às %H:%M')
        )

        # Combina labels padrão com labels extras
        all_labels = list(self.default_labels)
        if labels:
            for label in labels:
                if label not in all_labels:
                    all_labels.append(label)

        post_data = {
            'kind': 'blogger#post',
            'title': title,
            'content': html_body.strip(),
            'labels': all_labels,
        }

        logger.info(
            "Post formatado: '%s' | imagem: %s | labels: %d",
            title, 'sim' if image_url else 'nao', len(all_labels)
        )
        return post_data

    def _ensure_html(self, text: str) -> str:
        """
        Garante que o texto está formatado em HTML.

        Se o texto não contiver tags HTML, envolve parágrafos em tags <p>.

        Args:
            text: Texto a formatar

        Returns:
            Texto em HTML
        """
        if not text:
            return '<p>Conteúdo não disponível.</p>'

        # Se já tem tags HTML, retorna como está
        if '<p>' in text or '<div>' in text or '<br' in text:
            return text

        # Converte texto puro em HTML
        paragraphs = text.split('\n\n')
        if len(paragraphs) <= 1:
            paragraphs = text.split('\n')

        html_parts = []
        for para in paragraphs:
            para = para.strip()
            if para:
                html_parts.append(f'<p>{para}</p>')

        return '\n'.join(html_parts) if html_parts else f'<p>{text}</p>'
