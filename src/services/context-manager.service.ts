import { logger } from '../config/logger';

export interface ConversationContext {
  contratoId?: string;
  operadoraNome?: string;
  procedimentoId?: string;
  guiaId?: string;
  [key: string]: any;
}

export class ContextManagerService {
  private conversationContexts: Map<string, ConversationContext> = new Map();

  /**
   * Obtém o contexto da conversa
   */
  getContext(conversationId: string): ConversationContext {
    if (!this.conversationContexts.has(conversationId)) {
      this.conversationContexts.set(conversationId, {});
    }
    return this.conversationContexts.get(conversationId)!
  }

  /**
   * Atualiza o contexto da conversa
   */
  updateContext(conversationId: string, updates: Partial<ConversationContext>): void {
    const context = this.getContext(conversationId);
    Object.assign(context, updates);
    logger.debug(
      `[Context] Atualizado para conversa ${conversationId}:`,
      context
    );
  }

  /**
   * Extrai IDs da resposta e atualiza o contexto
   */
  extractAndUpdateContext(
    conversationId: string,
    response: any
  ): void {
    const context = this.getContext(conversationId);

    // Extrair contratoId
    if (response?.data?.id) {
      context.contratoId = response.data.id;
      logger.debug(
        `[Context] Extraído contratoId: ${context.contratoId}`
      );
    }

    // Extrair operadoraNome
    if (response?.data?.operadoraNome) {
      context.operadoraNome = response.data.operadoraNome;
    }

    // Extrair de arrays de contratos
    if (Array.isArray(response?.data) && response.data.length > 0) {
      const firstItem = response.data[0];
      if (firstItem?.id) {
        context.contratoId = firstItem.id;
        logger.debug(
          `[Context] Extraído contratoId do array: ${context.contratoId}`
        );
      }
      if (firstItem?.operadoraNome) {
        context.operadoraNome = firstItem.operadoraNome;
      }
    }

    this.updateContext(conversationId, context);
  }

  /**
   * Limpa o contexto da conversa
   */
  clearContext(conversationId: string): void {
    this.conversationContexts.delete(conversationId);
    logger.debug(`[Context] Contexto limpo para conversa ${conversationId}`);
  }

  /**
   * Limpa todos os contextos (útil para testes)
   */
  clearAllContexts(): void {
    this.conversationContexts.clear();
    logger.debug('[Context] Todos os contextos foram limpos');
  }
}
