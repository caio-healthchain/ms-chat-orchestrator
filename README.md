# ms-chat-orchestrator

Orquestrador de chat híbrido (MCP + RAG) para a plataforma Lazarus.

## 📋 Descrição

O **ms-chat-orchestrator** é o cérebro do sistema de chat da plataforma Lazarus. Ele classifica perguntas dos usuários e roteia para o serviço apropriado:

- **Perguntas Analíticas** → MCP Servers (ms-guide, ms-procedures, ms-audit)
- **Perguntas de Conhecimento** → RAG (chat Java existente com Azure AI Search)

## 🏗️ Arquitetura

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  ms-chat-orchestrator   │
│                         │
│  ┌─────────────────┐   │
│  │  Classifier     │   │
│  │  (GPT-4o-mini)  │   │
│  └────────┬────────┘   │
│           │            │
│     ┌─────┴─────┐     │
│     │           │     │
│     ▼           ▼     │
│  ┌────┐      ┌────┐  │
│  │MCP │      │RAG │  │
│  └─┬──┘      └─┬──┘  │
└────┼──────────┼──────┘
     │          │
     │          └──────────────┐
     │                         │
     ▼                         ▼
┌─────────────────┐    ┌──────────────┐
│  MCP Servers    │    │  RAG Service │
│                 │    │  (Java)      │
│ • ms-guide      │    │              │
│ • ms-procedures │    │ Azure AI     │
│ • ms-audit      │    │ Search       │
└─────────────────┘    └──────────────┘
```

## 🚀 Funcionalidades

### Perguntas Analíticas (MCP)

- **Guias**: "Quantas guias foram finalizadas hoje?"
- **Procedimentos**: "Quais foram os procedimentos mais realizados?"
- **Savings**: "Quanto eu tive de economia com correções?"
- **Receita**: "Qual o valor de receita do dia?"

### Perguntas de Conhecimento (RAG)

- "Como funciona o processo de auditoria?"
- "Quais são as políticas de faturamento?"
- "Como cadastrar um novo contrato?"

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3005 |
| `OPENAI_API_KEY` | Chave da API OpenAI | - |
| `MS_GUIDE_URL` | URL do ms-guide | http://localhost:3002 |
| `MS_PROCEDURES_URL` | URL do ms-procedures | http://localhost:3003 |
| `MS_AUDIT_URL` | URL do ms-audit | http://localhost:3004 |
| `RAG_SERVICE_URL` | URL do RAG (Java) | http://localhost:8080 |

## 📚 API

### POST /api/v1/chat

Envia uma pergunta ao chat.

**Request:**
```json
{
  "question": "Quantas guias foram finalizadas hoje?",
  "conversationId": "uuid-optional",
  "userId": "user-id-optional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Foram finalizadas 38 guias hoje, de um total de 45 guias criadas.",
    "source": "mcp",
    "confidence": 0.9,
    "metadata": {
      "toolsUsed": ["ms-guide/get_daily_guides_summary"],
      "dataRetrieved": [...]
    }
  }
}
```

### GET /health

Health check do serviço.

## 🧪 Testes

```bash
npm test
```

## 📖 Documentação

Acesse a documentação Swagger em:
```
http://localhost:3005/api-docs
```

## 🔄 Fluxo de Processamento

1. **Recebe pergunta** do frontend
2. **Classifica** com GPT-4o-mini (analytics vs knowledge)
3. **Roteia** para MCP ou RAG
4. **Executa** tools MCP ou consulta RAG
5. **Formata** resposta com LLM
6. **Retorna** resposta formatada

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **OpenAI** - Classificação e formatação
- **MCP SDK** - Protocolo de comunicação
- **Axios** - Cliente HTTP
- **Winston** - Logging
- **Swagger** - Documentação

## 📝 Licença

Propriedade de HealthChain Solutions
