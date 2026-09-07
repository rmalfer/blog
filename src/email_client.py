"""
Cliente de envio de posts para o Blogger via E-mail (Mail-to-Blogger).

Usa SMTP com conformidade RFC completa (headers, Message-ID, multipart plain/html)
para garantir entrega limpa sem bloqueio pelos filtros anti-spam do Gmail.
"""

import smtplib
import logging
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import make_msgid, formatdate
from typing import Optional

logger = logging.getLogger(__name__)


def _html_to_plain(html: str) -> str:
    """Extrai texto simples do HTML para criar versão text/plain do e-mail."""
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


class BloggerEmailClient:
    """Envia posts para o Blogger usando o recurso nativo de publicação por e-mail."""

    def __init__(self, smtp_server: str, smtp_port: int,
                 sender_email: str, sender_password: str,
                 blogger_email: str):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password.replace(' ', '')
        self.blogger_email = blogger_email

    def send_post(self, title: str, html_content: str) -> bool:
        """
        Envia o post formatado com cabeçalhos RFC completos para o e-mail do Blogger.
        """
        try:
            logger.info("Enviando post por e-mail: '%s' para %s", title, self.blogger_email)

            msg = MIMEMultipart('alternative')
            msg['Subject'] = title
            msg['From'] = f"Riccardo Malfer <{self.sender_email}>"
            msg['To'] = self.blogger_email
            msg['Date'] = formatdate(localtime=True)
            msg['Message-ID'] = make_msgid(domain='gmail.com')
            msg['X-Mailer'] = 'Python-MailBlogger/1.0'

            # 1. Versão texto simples (obrigatória para evitar filtros anti-spam)
            plain_text = _html_to_plain(html_content)
            part_plain = MIMEText(plain_text, 'plain', 'utf-8')
            msg.attach(part_plain)

            # 2. Versão HTML (que o Blogger vai usar para renderizar o post)
            part_html = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(part_html)

            # Conexão SMTP com STARTTLS
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(self.sender_email, self.sender_password)
            server.sendmail(self.sender_email, [self.blogger_email], msg.as_string())
            server.quit()

            logger.info("✅ Post enviado com sucesso por e-mail para o Blogger!")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error("❌ Erro de autenticação SMTP: %s. Verifique sua Senha de App do Google.", e)
            return False
        except Exception as e:
            logger.error("❌ Erro ao enviar post por e-mail: %s", e)
            return False
