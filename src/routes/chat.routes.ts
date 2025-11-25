import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();
const chatController = new ChatController();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Endpoints de chat híbrido (MCP + RAG)
 */

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     tags: [Chat]
 *     summary: Enviar pergunta ao chat
 *     description: Processa pergunta do usuário roteando para MCP (analytics) ou RAG (conhecimento)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: Pergunta do usuário
 *                 example: Quantas guias foram finalizadas hoje?
 *               conversationId:
 *                 type: string
 *                 description: ID da conversa (opcional)
 *               userId:
 *                 type: string
 *                 description: ID do usuário (opcional)
 *     responses:
 *       200:
 *         description: Resposta processada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     answer:
 *                       type: string
 *                     source:
 *                       type: string
 *                       enum: [mcp, rag, hybrid]
 *                     confidence:
 *                       type: number
 *                     metadata:
 *                       type: object
 *       400:
 *         description: Requisição inválida
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/chat', (req, res) => chatController.chat(req, res));

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Chat]
 *     summary: Health check
 *     description: Verifica se o serviço está funcionando
 *     responses:
 *       200:
 *         description: Serviço funcionando
 */
router.get('/health', (req, res) => chatController.healthCheck(req, res));

export default router;
