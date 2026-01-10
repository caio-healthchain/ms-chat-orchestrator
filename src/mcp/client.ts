import axios from 'axios';
import { logger } from '../config/logger';

export interface MCPToolCall {
  service: string;
  tool: string;
  arguments: Record<string, any>;
}

export interface MCPResponse {
  success: boolean;
  data: any;
  error?: string;
}

export class MCPClient {
  private serviceUrls: Record<string, string>;

  constructor() {
    this.serviceUrls = {
      'ms-guide': process.env.MS_GUIDE_URL || 'http://localhost:3002',
      'ms-procedures': process.env.MS_PROCEDURES_URL || 'http://localhost:3003',
      'ms-audit': process.env.MS_AUDIT_URL || 'http://localhost:3004',
    };
  }

  /**
   * Mapeia tool MCP para endpoint REST
   */
  private mapToolToEndpoint(service: string, tool: string, args: Record<string, any>): { url: string; params: Record<string, any> } {
    const baseUrl = this.serviceUrls[service];
    
    const toolMap: Record<string, Record<string, { endpoint: string; method: string }>> = {
      'ms-guide': {
        'get_daily_guides_summary': { endpoint: '/api/v1/analytics/guides/daily-summary', method: 'GET' },
        'get_guides_revenue': { endpoint: '/api/v1/analytics/guides/revenue', method: 'GET' },
        'get_guides_by_status': { endpoint: '/api/v1/analytics/guides/by-status', method: 'GET' },
        'get_guides_by_operator': { endpoint: '/api/v1/analytics/guides/by-operator', method: 'GET' },
      },
      'ms-procedures': {
        'get_top_procedures': { endpoint: '/api/v1/analytics/procedures/top', method: 'GET' },
        'get_procedures_statistics': { endpoint: '/api/v1/analytics/procedures/statistics', method: 'GET' },
        'get_efficiency_metrics': { endpoint: '/api/v1/analytics/procedures/efficiency', method: 'GET' },
        'get_category_analysis': { endpoint: '/api/v1/analytics/procedures/category', method: 'GET' },
        'get_procedures_by_period': { endpoint: '/api/v1/analytics/procedures/by-period', method: 'GET' },
      },
      'ms-audit': {
        'get_savings_summary': { endpoint: '/api/v1/analytics/savings', method: 'GET' },
        'get_audit_metrics': { endpoint: '/api/v1/analytics/audit-metrics', method: 'GET' },
        'get_correction_analysis': { endpoint: '/api/v1/analytics/corrections', method: 'GET' },
        'get_billing_analysis': { endpoint: '/api/v1/analytics/billing', method: 'GET' },
      },
    };

    const mapping = toolMap[service]?.[tool];
    if (!mapping) {
      throw new Error(`Tool ${tool} não encontrada no serviço ${service}`);
    }

    return {
      url: `${baseUrl}${mapping.endpoint}`,
      params: args,
    };
  }

  /**
   * Executa uma tool MCP via REST API com retry
   */
  async executeTool(toolCall: MCPToolCall, retries = 3, delay = 1000): Promise<MCPResponse> {
    try {
      logger.info(`[MCP Client] Executando tool: ${toolCall.service}/${toolCall.tool}`, { args: toolCall.arguments });

      const { url, params } = this.mapToolToEndpoint(toolCall.service, toolCall.tool, toolCall.arguments);

      const response = await axios.get(url, {
        params,
        timeout: 30000, // Aumentado para 30 segundos
      });

      logger.info(`[MCP Client] Tool executada com sucesso: ${toolCall.tool}`);

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      logger.error(`[MCP Client] Erro ao executar tool ${toolCall.tool} (tentativa ${4 - retries}):`, error.message);
      
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return this.executeTool(toolCall, retries - 1, delay * 2);
      }

      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Executa múltiplas tools em paralelo
   */
  async executeMultipleTools(toolCalls: MCPToolCall[]): Promise<MCPResponse[]> {
    const promises = toolCalls.map(toolCall => this.executeTool(toolCall));
    return Promise.all(promises);
  }
}
