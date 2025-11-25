import { Request, Response } from 'express';
import { OrchestratorService } from '../services/orchestrator.service';
import { logger } from '../config/logger';

export class ChatController {
  private orchestrator: OrchestratorService;

  constructor() {
    this.orchestrator = new OrchestratorService();
  }

  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { question, conversationId, userId } = req.body;

      if (!question) {
        res.status(400).json({
          success: false,
          error: 'Campo "question" é obrigatório',
        });
        return;
      }

      logger.info(`[Chat] Nova pergunta recebida`, { question, userId });

      const response = await this.orchestrator.processQuestion({
        question,
        conversationId,
        userId,
      });

      res.json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      logger.error('[Chat] Erro ao processar chat:', error.message);
      res.status(500).json({
        success: false,
        error: 'Erro ao processar pergunta',
      });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      service: 'ms-chat-orchestrator',
      status: 'running',
      timestamp: new Date().toISOString(),
    });
  }
}
