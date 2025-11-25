import axios from 'axios';
import { logger } from '../config/logger';

export interface RAGResponse {
  answer: string;
  confidence: number;
  sources?: string[];
}

export class RAGClient {
  private ragUrl: string;

  constructor() {
    this.ragUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8080';
  }

  /**
   * Consulta o serviço RAG (chat Java existente)
   */
  async query(question: string): Promise<RAGResponse> {
    try {
      logger.info(`[RAG Client] Consultando RAG: "${question}"`);

      const response = await axios.post(
        `${this.ragUrl}/api/chat`,
        { message: question },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('[RAG Client] Resposta recebida do RAG');

      return {
        answer: response.data.response || response.data.answer || response.data,
        confidence: response.data.confidence || 0.8,
        sources: response.data.sources || [],
      };
    } catch (error: any) {
      logger.error('[RAG Client] Erro ao consultar RAG:', error.message);

      // Fallback: resposta genérica
      return {
        answer: 'Desculpe, não consegui encontrar informações sobre isso no momento. Por favor, reformule sua pergunta ou entre em contato com o suporte.',
        confidence: 0.3,
      };
    }
  }
}
