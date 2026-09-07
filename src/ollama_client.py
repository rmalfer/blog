"""
Cliente para Ollama API local.

Gera resumos expandidos de notícias usando o modelo gemma4:12b rodando localmente.
"""

import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)


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
                         link: str = '') -> Optional[str]:
        """
        Gera um resumo expandido usando Ollama.
        
        Args:
            title: Título da notícia
            content: Conteúdo/matéria original (pode ser vazio)
            link: Link da fonte original
            
        Returns:
            Texto HTML do resumo gerado, ou None em caso de erro
        """
        # Monta o prompt com as informações disponíveis
        prompt_parts = [f"Título da notícia: {title}"]
        
        if content:
            prompt_parts.append(f"Resumo original: {content}")
        
        if link:
            prompt_parts.append(f"Fonte: {link}")
        
        prompt_parts.append(
            "\nCom base nas informações acima, escreva um artigo completo "
            "em HTML (usando tags <p>, <strong>, <em>) sobre esta notícia de IA. "
            "O artigo deve ser informativo, bem estruturado e em português do Brasil."
        )
        
        prompt = "\n".join(prompt_parts)
        
        try:
            logger.info("Gerando resumo com Ollama (%s) para: %s", self.model, title)
            
            payload = {
                'model': self.model,
                'prompt': prompt,
                'system': self.system_prompt,
                'stream': False,
                'options': {
                    'temperature': self.temperature,
                    'num_predict': self.num_predict,
                }
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120  # Timeout generoso para modelos grandes
            )
            response.raise_for_status()
            
            result = response.json()
            generated_text = result.get('response', '').strip()
            
            if not generated_text:
                logger.warning("Ollama retornou resposta vazia para: %s", title)
                return None
            
            # Log de métricas
            eval_count = result.get('eval_count', 0)
            total_duration_ms = result.get('total_duration', 0) / 1_000_000
            logger.info(
                "Resumo gerado: %d tokens em %.0fms para '%s'",
                eval_count, total_duration_ms, title
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
