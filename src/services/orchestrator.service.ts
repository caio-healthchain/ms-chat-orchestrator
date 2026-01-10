import OpenAI from 'openai';
import { ClassifierService } from './classifier.service';
import { MCPClient } from '../mcp/client';
import { RAGClient } from './rag.client';
import { logger } from '../config/logger';

export interface ChatRequest {
  question: string;
  conversationId?: string;
  userId?: string;
}

export interface ChatResponse {
  answer: string;
  source: 'mcp' | 'rag' | 'hybrid';
  confidence: number;
  metadata?: {
    toolsUsed?: string[];
    dataRetrieved?: any;
  };
}

export class OrchestratorService {
  private classifier: ClassifierService;
  private mcpClient: MCPClient;
  private ragClient: RAGClient;
  private openai: OpenAI | null = null;

  constructor() {
    this.classifier = new ClassifierService();
    this.mcpClient = new MCPClient();
    this.ragClient = new RAGClient();
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      logger.info('[Orchestrator] OpenAI client inicializado com sucesso.');
    } else {
      logger.warn('[Orchestrator] OPENAI_API_KEY não encontrada. Formatação de resposta pode ser limitada.');
    }
  }

  /**
   * Processa pergunta do usuário
   */
  async processQuestion(request: ChatRequest): Promise<ChatResponse> {
    try {
      logger.info(`[Orchestrator] Processando pergunta: "${request.question}"`);

      // 1. Classificar pergunta
      const classification = await this.classifier.classifyQuestion(request.question);

      // 2. Rotear para serviço apropriado
      if (classification.type === 'analytics' && classification.toolCalls) {
        return await this.handleAnalyticsQuestion(request.question, classification.toolCalls);
      } else {
        return await this.handleKnowledgeQuestion(request.question, classification.ragQuery || request.question);
      }
    } catch (error: any) {
      logger.error('[Orchestrator] Erro ao processar pergunta:', error.message);
      
      return {
        answer: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.',
        source: 'rag',
        confidence: 0,
      };
    }
  }

  /**
   * Processa pergunta analítica via MCP
   */
  private async handleAnalyticsQuestion(question: string, toolCalls: any[]): Promise<ChatResponse> {
    logger.info(`[Orchestrator] Processando pergunta analítica com ${toolCalls.length} tool(s)`);

    // Executar tools MCP
    const results = await this.mcpClient.executeMultipleTools(toolCalls);

    // Agregar dados
    const successfulResults = results.filter(r => r.success);
    const dataRetrieved = successfulResults.map(r => r.data);

    if (successfulResults.length === 0) {
      return {
        answer: 'Não foi possível obter os dados solicitados no momento.',
        source: 'mcp',
        confidence: 0,
      };
    }

    // Formatar resposta com LLM
    const formattedAnswer = await this.formatAnalyticsAnswer(question, dataRetrieved);

    return {
      answer: formattedAnswer,
      source: 'mcp',
      confidence: 0.9,
      metadata: {
        toolsUsed: toolCalls.map(tc => `${tc.service}/${tc.tool}`),
        dataRetrieved,
      },
    };
  }

  /**
   * Formata resposta analítica com LLM
   */
  private async formatAnalyticsAnswer(question: string, data: any[]): Promise<string> {
    if (!this.openai) {
      logger.warn('[Orchestrator] OpenAI não configurado. Retornando dados brutos.');
      return JSON.stringify(data, null, 2);
    }

    const systemPrompt = `Você é um assistente de análise de dados hospitalares.

Sua tarefa é formatar os dados em uma resposta clara e profissional em português.

Regras:
- Use números formatados (ex: R$ 1.234,56)
- Seja conciso mas informativo
- Destaque insights importantes
- Use bullet points quando apropriado`;

    const userPrompt = `Pergunta: ${question}

Dados obtidos:
${JSON.stringify(data, null, 2)}

Formate uma resposta clara e profissional.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || 'Dados processados com sucesso.';
  }

  /**
   * Processa pergunta de conhecimento via RAG
   */
  private async handleKnowledgeQuestion(question: string, ragQuery: string): Promise<ChatResponse> {
    logger.info(`[Orchestrator] Processando pergunta de conhecimento via RAG`);

    const ragResponse = await this.ragClient.query(ragQuery);

    return {
      answer: ragResponse.answer,
      source: 'rag',
      confidence: ragResponse.confidence,
    };
  }
}
