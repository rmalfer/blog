"""
Cliente para Ollama API local.

Gera resumos expandidos de notícias usando o modelo gemma4:12b rodando localmente.
"""

import logging
import re
import requests
from typing import Optional

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
}


def fetch_source_article_text(url: str, timeout: int = 6, max_chars: int = 3000) -> str:
    """
    Extrai o texto principal da página da notícia original (quando acessível)
    para enriquecer o contexto fornecido ao Ollama.
    """
    if not url or not url.startswith(('http://', 'https://')):
        return ''
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code != 200:
            return ''
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, 'html.parser')
        for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'form']):
            tag.decompose()
        container = soup.find('article') or soup.find('main') or soup.body or soup
        paragraphs = []
        total_len = 0
        for p in container.find_all('p'):
            txt = p.get_text(" ", strip=True)
            if len(txt) >= 60:
                paragraphs.append(txt)
                total_len += len(txt)
                if total_len >= max_chars:
                    break
        return "\n\n".join(paragraphs)[:max_chars]
    except Exception:
        return ''


def clean_generated_html(text: str) -> str:
    """Remove blocos markdown e tags <h1> indesejadas da resposta do LLM."""
    if not text:
        return ''
    cleaned = text.strip()
    cleaned = re.sub(r'^```(?:html)?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = re.sub(r'<h1[^>]*>.*?</h1>', '', cleaned, flags=re.IGNORECASE | re.DOTALL).strip()
    return cleaned


class OllamaClient:
    """Cliente para interação com Ollama API local."""
    
    def __init__(self, base_url: str = 'http://localhost:11434',
                 model: str = 'gemma4:12b',
                 temperature: float = 0.7,
                 num_predict: int = 2048,
                 system_prompt: str = ''):
        """
        Inicializa o cliente Ollama.
        
        Args:
            base_url: URL base do Ollama (padrão: http://localhost:11434)
            model: Nome do modelo a usar
            temperature: Temperatura para geração (0.0 a 1.0)
            num_predict: Número máximo de tokens a gerar
            system_prompt: Prompt de sistema para contextualizar o modelo
        """
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.temperature = temperature
        self.num_predict = num_predict
        self.system_prompt = system_prompt or (
            "Você é um jornalista de tecnologia especializado em Inteligência Artificial. "
            "Escreva um artigo detalhado e envolvente em português do Brasil sobre o tema fornecido. "
            "O texto deve ter entre 4-6 parágrafos, ser informativo e acessível ao público geral. "
            "Use um tom profissional mas acessível. "
            "NÃO inclua título no texto, apenas o corpo do artigo. "
            "Formate o texto em HTML com tags <p> para parágrafos, <strong> para destaques e <em> para ênfase."
        )
    
    def is_available(self) -> bool:
        """
        Verifica se o Ollama está rodando e acessível.
        
        Returns:
            True se o Ollama está acessível
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except requests.ConnectionError:
            logger.warning("Ollama não está acessível em %s", self.base_url)
            return False
        except Exception as e:
            logger.warning("Erro ao verificar Ollama: %s", e)
            return False
    
    def is_model_available(self) -> bool:
        """
        Verifica se o modelo configurado está disponível no Ollama.
        
        Returns:
            True se o modelo está disponível
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                # Verifica match exato ou parcial (ex: 'gemma4:12b' match 'gemma4:12b')
                available = any(
                    self.model in name or name.startswith(self.model.split(':')[0])
                    for name in model_names
                )
                if not available:
                    logger.warning(
                        "Modelo '%s' não encontrado. Modelos disponíveis: %s",
                        self.model, model_names
                    )
                return available
            return False
        except Exception as e:
            logger.warning("Erro ao verificar modelo: %s", e)
            return False
    
    def generate_summary(self, title: str, content: str = '', 
                         link: str = '', source_text: str = '',
                         fetch_source: bool = True) -> Optional[str]:
        """
        Gera uma reportagem expandida e aprofundada usando Ollama.
        
        Args:
            title: Título da notícia
            content: Conteúdo/resumo base da planilha (pode ser vazio)
            link: Link da fonte original
            source_text: Texto extraído previamente da fonte original (opcional)
            fetch_source: Se True e source_text vazio, tenta extrair texto do link
            
        Returns:
            Texto HTML do artigo gerado, ou None em caso de erro
        """
        # Monta o prompt com as informações disponíveis
        prompt_parts = [f"Título da notícia: {title}"]
        
        if content:
            prompt_parts.append(f"Resumo/Contexto base: {content}")
        
        if not source_text and fetch_source and link:
            source_text = fetch_source_article_text(link)
            
        if source_text:
            prompt_parts.append(f"Trechos da fonte original:\n{source_text}")
        
        if link:
            prompt_parts.append(f"Fonte de referência: {link}")
        
        prompt_parts.append(
            "\nCom base nas informações acima, escreva uma reportagem completa, extensa e analítica "
            "em HTML puro (usando tags <p>, <h2>, <strong>, <em>) com 5 a 6 parágrafos bem desenvolvidos "
            "(cerca de 450 a 650 palavras) e 2 subtítulos <h2> organizando as seções. "
            "NÃO inclua tag <h1> nem blocos markdown (```html). Comece diretamente com <p>."
        )
        
        prompt = "\n".join(prompt_parts)
        
        try:
            logger.info("Gerando reportagem completa com Ollama (%s) para: %s", self.model, title)
            
            payload = {
                'model': self.model,
                'prompt': prompt,
                'system': self.system_prompt,
                'think': False,
                'stream': False,
                'options': {
                    'temperature': self.temperature,
                    'num_predict': self.num_predict,
                    'num_ctx': 4096,
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120  # Timeout generoso para modelos grandes
            )
            response.raise_for_status()
            
            result = response.json()
            generated_text = clean_generated_html(result.get('response', ''))
            
            if not generated_text:
                logger.warning("Ollama retornou resposta vazia para: %s", title)
                return None
            
            # Log de métricas
            eval_count = result.get('eval_count', 0)
            total_duration_ms = result.get('total_duration', 0) / 1_000_000
            logger.info(
                "Artigo gerado: %d tokens (%d chars) em %.0fms para '%s'",
                eval_count, len(generated_text), total_duration_ms, title
            )
            
            return generated_text
            
        except requests.Timeout:
            logger.error("Timeout ao gerar resumo para: %s", title)
            return None
        except requests.ConnectionError:
            logger.error("Ollama não acessível. Verifique se está rodando em %s", self.base_url)
            return None
        except Exception as e:
            logger.error("Erro ao gerar resumo para '%s': %s", title, e)
            return None
