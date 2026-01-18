import OpenAI from 'openai';
import { logger } from '../config/logger';
import { MCPToolCall } from '../mcp/client';

export interface ClassificationResult {
  type: 'analytics' | 'knowledge';
  confidence: number;
  toolCalls?: MCPToolCall[];
  ragQuery?: string;
}

export class ClassifierService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      logger.info('[Classifier] OpenAI client inicializado com sucesso.');
    } else {
      logger.warn('[Classifier] OPENAI_API_KEY não encontrada. Classificador usará fallback.');
    }
  }

  /**
   * Classifica a pergunta do usuário
   */
  async classifyQuestion(question: string): Promise<ClassificationResult> {
    if (!this.openai) {
      return this.fallback(question);
    }

    try {
      logger.info(`[Classifier] Classificando pergunta: "${question}"`);

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

  private fallback(question: string): ClassificationResult {
    logger.warn('[Classifier] Usando fallback: assumindo pergunta de conhecimento.');
    return {
      type: 'knowledge',
      confidence: 0.5,
      ragQuery: question,
    };
  }
}
