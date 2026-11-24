"""
Cliente para Ollama API local.

Gera reportagens e análises originais com variação estrutural inteligente
(número aleatório de bullets, formatos editoriais distintos e filtro anti-clichê)
usando o modelo gemma4:12b rodando localmente.
"""

import logging
import random
import re
import requests
from typing import Optional, Dict, Any

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

# Distribuição ponderada para quantidade aleatória de bullet points por matéria:
# 0 = narrativa direta sem box de destaques; 2 a 5 = número variável de bullets.
HIGHLIGHT_COUNT_CHOICES = [0, 2, 3, 4, 5]
HIGHLIGHT_COUNT_WEIGHTS = [0.25, 0.15, 0.25, 0.20, 0.15]

# Perfis editoriais variados para quebrar a uniformidade estrutural entre matérias
EDITORIAL_BLUEPRINTS = [
    {
        'id': 'analise_tecnica',
        'name': 'Análise Técnica Aprofundada',
        'target_words': '650 a 900 palavras',
        'structure': (
            "Estruture o corpo em 6 a 8 parágrafos <p> divididos por 3 subtítulos <h2> concretos e específicos "
            "(evite títulos genéricos). Explore a arquitetura técnica, os trade-offs de engenharia, custos ou limites reais "
            "de adoção e o que engenheiros e gestores precisam observar na prática."
        ),
    },
    {
        'id': 'reportagem_pratica',
        'name': 'Reportagem Direta & Impacto Prático',
        'target_words': '480 a 650 palavras',
        'structure': (
            "Estruture o corpo em 4 a 5 parágrafos <p> objetivos com 2 subtítulos <h2> claros e jornalísticos. "
            "Vá direto aos fatos verificáveis, números, datas e implicações práticas para empresas e profissionais no Brasil."
        ),
    },
    {
        'id': 'explicativo_estruturado',
        'name': 'Explicativo com Lista Analítica',
        'target_words': '580 a 820 palavras',
        'structure': (
            "Estruture o corpo em 5 a 6 parágrafos <p> com 2 ou 3 subtítulos <h2> e inclua no meio do texto "
            "uma lista <ul> comum (SEM data-highlights) de 3 a 5 itens detalhando impactos práticos, requisitos técnicos "
            "ou diferenças em relação à geração anterior."
        ),
    },
    {
        'id': 'coluna_critica',
        'name': 'Análise Crítica de Mercado',
        'target_words': '550 a 780 palavras',
        'structure': (
            "Escreva em tom analítico e crítico (cético em relação a promessas de marketing), usando 5 a 7 parágrafos <p>, "
            "1 ou 2 subtítulos <h2> e um bloco <blockquote> curto destacando a principal tese ou alerta estratégico do texto."
        ),
    },
    {
        'id': 'guia_perguntas',
        'name': 'Formato Perguntas do Leitor',
        'target_words': '600 a 850 palavras',
        'structure': (
            "Organize o corpo em 3 seções cujos subtítulos <h2> sejam perguntas diretas e reais que um leitor técnico faria "
            "(por exemplo sobre como funciona na prática, quais riscos existem e qual o impacto no mercado brasileiro), "
            "com 2 parágrafos <p> bem fundamentados em cada seção."
        ),
    },
]

ANTI_CLICHE_RULES = (
    "REGRAS DE QUALIDADE E ORIGINALIDADE EDITORIAL:\n"
    "- PROIBIDO usar clichês típicos de IA como: 'não é apenas X, mas Y', 'não foi apenas X', "
    "'choque sísmico', 'lembrete brutal', 'ponto de inflexão', 'cenário em constante evolução', "
    "'divisor de águas' ou subtítulos genéricos como 'Perspectivas Futuras e o Ecossistema'.\n"
    "- Escreva com naturalidade jornalística em português do Brasil, variando o ritmo das frases e ancorando "
    "as afirmações em fatos concretos, nomes de modelos, métricas, limitações e contexto prático.\n"
    "- NÃO inclua tag <h1> nem blocos markdown (```html). Retorne apenas HTML semântico limpo."
)


def choose_editorial_plan(seed_text: str = '') -> Dict[str, Any]:
    """
    Seleciona aleatoriamente o número de bullets e o formato editorial
    para que cada artigo tenha estrutura orgânica e não repetitiva.
    """
    rng = random.SystemRandom()
    bullet_count = rng.choices(HIGHLIGHT_COUNT_CHOICES, weights=HIGHLIGHT_COUNT_WEIGHTS, k=1)[0]
    blueprint = rng.choice(EDITORIAL_BLUEPRINTS)
    return {
        'bullet_count': bullet_count,
        'blueprint': blueprint,
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


def clean_generated_html(text: str, bullet_count: Optional[int] = None) -> str:
    """Remove blocos markdown, tags <h1> indesejadas e corrige tags HTML finais malformadas."""
    if not text:
        return ''
    cleaned = text.strip()
    cleaned = re.sub(r'^```(?:html)?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = re.sub(r'<h1[^>]*>.*?</h1>', '', cleaned, flags=re.IGNORECASE | re.DOTALL).strip()
    cleaned = cleaned.replace('</</p>', '</p>').replace('</>', '</p>')
    cleaned = re.sub(r'</p?$', '</p>', cleaned)

    valid_endings = ('</p>', '</ul>', '</ol>', '</blockquote>', '</table>', '</div>', '</h2>', '</h3>')
    if cleaned and not cleaned.lower().endswith(valid_endings):
        cleaned += '</p>'

    # Quando o plano sorteou 0 bullets, garante o marcador para o portal não fabricar caixa de destaques
    if bullet_count == 0:
        cleaned = re.sub(r'<ul[^>]*data-highlights=["\']true["\'][^>]*>[\s\S]*?</ul>', '', cleaned, flags=re.IGNORECASE).strip()
        if 'data-no-highlights="true"' not in cleaned:
            cleaned = f'<div data-no-highlights="true"></div>\n{cleaned}'

    return cleaned


class OllamaClient:
    """Cliente para interação com Ollama API local."""

    def __init__(self, base_url: str = 'http://localhost:11434',
                 model: str = 'gemma4:12b',
                 temperature: float = 0.78,
                 num_predict: int = 2400,
                 system_prompt: str = ''):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.temperature = temperature
        self.num_predict = num_predict
        self.system_prompt = system_prompt or (
            "Você é Riccardo Malfer, jornalista e especialista em Inteligência Artificial e Robótica. "
            "Escreva análises originais, críticas e bem fundamentadas em português do Brasil, "
            "adaptando a estrutura e o tom conforme o plano editorial indicado em cada pauta. "
            "Priorize fatos verificáveis, contexto técnico real e impacto prático para o leitor brasileiro. "
            "Retorne apenas HTML limpo, sem tag <h1> e sem blocos markdown."
        )

    def is_available(self) -> bool:
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
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
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
        Gera uma reportagem analítica com estrutura e quantidade de bullets variadas aleatoriamente.
        """
        plan = choose_editorial_plan(title)
        bullet_count = plan['bullet_count']
        blueprint = plan['blueprint']

        prompt_parts = [f"Pauta / Título: {title}"]

        if content:
            prompt_parts.append(f"Contexto inicial: {content}")

        if not source_text and fetch_source and link:
            source_text = fetch_source_article_text(link)

        if source_text:
            prompt_parts.append(f"Trechos da referência original:\n{source_text}")

        if link:
            prompt_parts.append(f"Fonte de referência: {link}")

        if bullet_count == 0:
            highlights_instruction = (
                "1. NÃO inclua lista de destaques nem <ul data-highlights=\"true\"> nesta matéria: "
                "abra diretamente no primeiro parágrafo <p> com um gancho jornalístico forte e contextual."
            )
        else:
            highlights_instruction = (
                f"1. Inicie com <ul data-highlights=\"true\"> contendo exatamente {bullet_count} bullet points objetivos "
                f"no formato <li><strong>Rótulo curto e específico:</strong> Síntese direta em 1 frase.</li> "
                f"(sem repetir literalmente o título)."
            )

        prompt_parts.append(
            f"\nPLANO EDITORIAL SORTEADO: {blueprint['name']} (extensão alvo: {blueprint['target_words']})\n"
            f"{highlights_instruction}\n"
            f"2. {blueprint['structure']}\n"
            f"3. Use <strong> e <em> com moderação para conceitos e termos técnicos relevantes.\n"
            f"4. No primeiro parágrafo <p>, não repita o contexto inicial palavra por palavra; traga contexto analítico próprio.\n\n"
            f"{ANTI_CLICHE_RULES}"
        )

        prompt = "\n".join(prompt_parts)

        # Varia levemente a temperatura para evitar textos com cadência repetitiva
        rng = random.SystemRandom()
        dynamic_temp = round(max(0.65, min(0.90, self.temperature + rng.uniform(-0.06, 0.08))), 2)

        try:
            logger.info(
                "Gerando artigo com Ollama (%s | estilo=%s | bullets=%d | temp=%.2f): %s",
                self.model, blueprint['id'], bullet_count, dynamic_temp, title
            )

            payload = {
                'model': self.model,
                'prompt': prompt,
                'system': self.system_prompt,
                'think': False,
                'stream': False,
                'options': {
                    'temperature': dynamic_temp,
                    'num_predict': self.num_predict,
                    'num_ctx': 6144,
                }
            }

            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=150
            )
            response.raise_for_status()

            result = response.json()
            generated_text = clean_generated_html(result.get('response', ''), bullet_count=bullet_count)

            if not generated_text:
                logger.warning("Ollama retornou resposta vazia para: %s", title)
                return None

            eval_count = result.get('eval_count', 0)
            total_duration_ms = result.get('total_duration', 0) / 1_000_000
            logger.info(
                "Artigo gerado: %d tokens (%d chars | bullets=%d | estilo=%s) em %.0fms para '%s'",
                eval_count, len(generated_text), bullet_count, blueprint['id'], total_duration_ms, title
            )

            return generated_text

        except requests.Timeout:
            logger.error("Timeout ao gerar artigo para: %s", title)
            return None
        except requests.ConnectionError:
            logger.error("Ollama não acessível. Verifique se está rodando em %s", self.base_url)
            return None
        except Exception as e:
            logger.error("Erro ao gerar artigo para '%s': %s", title, e)
            return None
