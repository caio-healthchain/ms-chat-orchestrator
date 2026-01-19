import OpenAI from 'openai';
import { logger } from '../config/logger';
import { MCPToolCall } from '../mcp/client';
import { MCPMapperService } from './mcp-mapper.service';

export interface ClassificationResult {
  type: 'analytics' | 'knowledge';
  confidence: number;
  toolCalls?: MCPToolCall[];
  ragQuery?: string;
}

export class ClassifierService {
  private openai: OpenAI | null = null;
  private mcpMapper: MCPMapperService;
  private context?: Record<string, any>;

  constructor() {
    this.mcpMapper = new MCPMapperService();
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      logger.info('[Classifier] OpenAI client inicializado com sucesso.');
    } else {
      logger.warn('[Classifier] OPENAI_API_KEY não encontrada. Classificador usará fallback.');
    }
  }

  /**
   * Define o contexto da conversa
   */
  setContext(context: Record<string, any>): void {
    this.context = context;
  }

  /**
   * Classifica a pergunta do usuário
   */
  async classifyQuestion(question: string, context?: Record<string, any>): Promise<ClassificationResult> {
    // Tratar saudações
    if (this.isGreeting(question)) {
      logger.info('[Classifier] Pergunta identificada como saudação');
      return {
        type: 'analytics',
        confidence: 1.0,
        toolCalls: [],
        ragQuery: undefined
      };
    }

    // Tentar mapear com MCPMapper primeiro (mais rápido e eficiente)
    const mappedMCPs = this.mcpMapper.mapQuestionToMCPs(question);
    if (mappedMCPs.length > 0) {
      logger.info(`[Classifier] Mapeamento direto encontrou ${mappedMCPs.length} MCP(s)`);
      const toolCalls = mappedMCPs.map(mcp => ({
        service: mcp.service,
        tool: mcp.tool,
        arguments: this.mcpMapper.extractParameters(question, mcp, context)
      }));
      return {
        type: 'analytics',
        confidence: 0.85,
        toolCalls
      };
    }

    // Se não encontrou mapeamento, usar OpenAI como fallback
    if (!this.openai) {
      return this.fallback(question);
    }

    try {
      logger.info(`[Classifier] Classificando pergunta com OpenAI: "${question}"`);

      const systemPrompt = `Você é um classificador de perguntas para um sistema hospitalar.

Classifique a pergunta do usuário em uma das categorias:
1. **analytics** - Perguntas sobre dados, métricas, estatísticas (ex: "Quantas guias foram finalizadas?", "Qual o saving?")
2. **knowledge** - Perguntas sobre conhecimento, procedimentos, políticas (ex: "Como funciona o processo de auditoria?")

Se for **analytics**, identifique qual(is) ferramenta(s) MCP usar:

**ms-guide:**
- get_daily_guides_summary: Resumo diário de guias (finalizadas, em andamento, canceladas)
- get_guides_revenue: Receita de guias
- get_guides_by_status: Guias por status
- get_guides_by_operator: Guias por operadora

**ms-procedures:**
- get_top_procedures: Procedimentos mais realizados
- get_procedures_statistics: Estatísticas de procedimentos
- get_efficiency_metrics: Métricas de eficiência (pontualidade, utilização de sala)
- get_category_analysis: Análise por categoria
- get_procedures_by_period: Procedimentos por período

**ms-audit:**
- get_savings_summary: Economia com correções
- get_audit_metrics: Métricas de auditoria
- get_correction_analysis: Análise de correções
- get_billing_analysis: Análise de faturamento

**ms-contracts:**
- get_contract_by_operadora: Contrato ativo de uma operadora
- get_contract_items: Itens de um contrato
- get_procedure_price: Valor contratado de um procedimento
- get_contract_summary: Resumo do contrato

Responda APENAS com JSON válido no formato:
{
  "type": "analytics" | "knowledge",
  "confidence": 0.0-1.0,
  "toolCalls": [{"service": "ms-guide", "tool": "get_daily_guides_summary", "arguments": {"period": "day"}}],
  "ragQuery": "pergunta reformulada para RAG" (apenas se type === "knowledge")
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content || '{}';
      const result: ClassificationResult = JSON.parse(content);

      logger.info(`[Classifier] Classificação: ${result.type} (confiança: ${result.confidence})`);

      return result;
    } catch (error: any) {
      logger.error('[Classifier] Erro ao classificar pergunta:', error.message);
      logger.error('[Classifier] Detalhes do erro:', {
        message: error.message,
        status: error.status,
        type: error.type,
        response: error.response?.data,
      });
      return this.fallback(question);
    }
  }

  /**
   * Verifica se a pergunta é uma saudação
   */
  private isGreeting(question: string): boolean {
    const greetings = ['olá', 'oi', 'opa', 'e aí', 'e ai', 'tudo bem', 'como vai', 'opa', 'hey', 'opa', 'oii'];
    const lowerQuestion = question.toLowerCase().trim();
    return greetings.some(greeting => lowerQuestion === greeting || lowerQuestion.startsWith(greeting));
  }

  private fallback(question: string): ClassificationResult {
    logger.warn('[Classifier] Usando fallback: assumindo pergunta de conhecimento.');
    return {
      type: 'knowledge',
      confidence: 0.5,
      ragQuery: question,
    };
  }

  /**
   * Retorna mensagem de boas-vindas
   */
  getWelcomeMessage(): string {
    return this.mcpMapper.generateWelcomeMessage();
  }

  /**
   * Retorna capacidades do chat
   */
  getCapabilities(): string[] {
    return this.mcpMapper.getCapabilities();
  }
}
