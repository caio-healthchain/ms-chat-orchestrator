import dotenv from 'dotenv';
dotenv.config(); // Carregar variáveis de ambiente ANTES de qualquer outro import

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import chatRoutes from './routes/chat.routes';
import { logger } from './config/logger';

class ChatOrchestratorService {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3005', 10);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: '*',
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(compression());
  }

  private initializeRoutes(): void {
    this.app.use('/api/v1', chatRoutes);

    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        service: 'ms-chat-orchestrator',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });
    
    this.app.get('/', (req, res) => {
      res.json({
        service: 'ms-chat-orchestrator',
        version: '1.0.0',
        status: 'running',
        description: 'Orquestrador de chat híbrido (MCP + RAG)',
      });
    });
  }

  private initializeSwagger(): void {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Chat Orchestrator API',
          version: '1.0.0',
          description: 'API do orquestrador de chat híbrido (MCP + RAG) para Lazarus',
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Development server',
          },
        ],
      },
      apis: ['./src/routes/*.ts'],
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Chat Orchestrator rodando na porta ${this.port}`);
      logger.info(`📚 Documentação: http://localhost:${this.port}/api-docs`);
      logger.info(`❤️  Health check: http://localhost:${this.port}/health`);
    });
  }
}

const service = new ChatOrchestratorService();
service.start();
