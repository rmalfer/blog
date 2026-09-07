# 🤖 Sistema Automatizado de Notícias de IA

Sistema que lê notícias de Inteligência Artificial de uma planilha Google Sheets,
gera resumos expandidos com Ollama (gemma4:12b) e publica automaticamente no Blogger.

## 📋 Pré-requisitos

- Python 3.10+
- Ollama instalado e rodando localmente (opcional, para gerar resumos)
- Modelo gemma4:12b baixado no Ollama: `ollama pull gemma4:12b`
- Conta Google com acesso ao Blogger e Google Sheets

## 🚀 Instalação

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Autenticar com Google (abre navegador)
python main.py auth

# 3. Testar (sem publicar)
python main.py run --dry-run

# 4. Executar de verdade
python main.py run
```

## 📊 Estrutura da Planilha

A planilha deve ter as seguintes colunas:

| Coluna A | Coluna B | Coluna C | Coluna D | Coluna E | Coluna F |
|----------|----------|----------|----------|----------|----------|
| Data de Inclusão | Título | Matéria | Link | Status | URL do Post |

- **Status** e **URL do Post** são preenchidos automaticamente pelo sistema.
- Notícias com Status vazio ou "Pendente" serão processadas.
- Após publicação, o Status muda para "Publicado".

## ⚙️ Configuração

Edite `config/settings.yaml` para ajustar:
- ID da planilha e do blog
- Horário de execução
- Modelo do Ollama
- Número máximo de posts por execução
- Labels padrão

## 🕐 Agendamento Automático

### Windows Task Scheduler
```bash
# Criar tarefa agendada (diário às 09:00)
python setup_scheduler.py create --time 09:00

# Verificar status
python setup_scheduler.py check

# Remover tarefa
python setup_scheduler.py remove
```

### Modo Daemon (alternativo)
```bash
# Roda em background com agendamento interno
python main.py daemon
```

## 📁 Estrutura do Projeto

```
blog/
├── config/
│   ├── client_secret.json    # Credenciais OAuth
│   └── settings.yaml         # Configurações
├── src/
│   ├── auth.py               # Autenticação OAuth2
│   ├── sheets_reader.py      # Leitor Google Sheets
│   ├── ollama_client.py      # Cliente Ollama
│   ├── post_formatter.py     # Formatador HTML
│   ├── blogger_client.py     # Cliente Blogger API
│   └── pipeline.py           # Orquestração
├── data/
│   └── token.json            # Token OAuth (gerado automaticamente)
├── logs/                     # Logs de execução
├── main.py                   # Entry point
├── setup_scheduler.py        # Agendamento Windows
├── requirements.txt          # Dependências
└── README.md
```

## 🔄 Fluxo de Execução

1. Lê notícias pendentes da planilha Google Sheets
2. Para cada notícia:
   - Se o conteúdo é curto ou ausente → gera resumo com Ollama
   - Formata como HTML estilizado
   - Publica no Blogger
   - Marca como "Publicado" na planilha
3. Gera log da execução

## 🛠️ Comandos

| Comando | Descrição |
|---------|----------|
| `python main.py run` | Executa o pipeline |
| `python main.py run --dry-run` | Testa sem publicar |
| `python main.py auth` | Autenticação OAuth |
| `python main.py list-blogs` | Lista seus blogs |
| `python main.py daemon` | Modo daemon agendado |
