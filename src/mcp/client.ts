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
      'ms-guide': process.env.MS_GUIDE_URL || 'http://localhost:3002/api/v1',
      'ms-procedures': process.env.MS_PROCEDURES_URL || 'http://localhost:3003/api/v1',
      'ms-audit': process.env.MS_AUDIT_URL || 'http://localhost:3004/api/v1',
      'ms-contracts': process.env.MS_CONTRACTS_URL || 'http://localhost:3014/api',
    };
    
    logger.info('[MCP Client] Service URLs configuradas:', {
      'ms-guide': this.serviceUrls['ms-guide'],
      'ms-procedures': this.serviceUrls['ms-procedures'],
      'ms-audit': this.serviceUrls['ms-audit'],
      'ms-contracts': this.serviceUrls['ms-contracts'],
    });
  }

  /**
   * Mapeia tool MCP para endpoint REST
   */
  private mapToolToEndpoint(service: string, tool: string, args: Record<string, any>): { url: string; params: Record<string, any> } {
    const baseUrl = this.serviceUrls[service];
    
    const toolMap: Record<string, Record<string, { endpoint: string; method: string }>> = {
      'ms-guide': {
        'get_daily_guides_summary': { endpoint: '/analytics/guides/daily-summary', method: 'GET' },
        'get_guides_revenue': { endpoint: '/analytics/guides/revenue', method: 'GET' },
        'get_guides_by_status': { endpoint: '/analytics/guides/by-status', method: 'GET' },
        'get_guides_by_operator': { endpoint: '/analytics/guides/by-operator', method: 'GET' },
        'get_guides_history': { endpoint: '/analytics/guides/history', method: 'GET' },
      },
      'ms-procedures': {
        'get_top_procedures': { endpoint: '/analytics/procedures/top', method: 'GET' },
        'get_procedures_statistics': { endpoint: '/analytics/procedures/statistics', method: 'GET' },
        'get_efficiency_metrics': { endpoint: '/analytics/procedures/efficiency', method: 'GET' },
        'get_category_analysis': { endpoint: '/analytics/procedures/category', method: 'GET' },
        'get_procedures_by_period': { endpoint: '/analytics/procedures/by-period', method: 'GET' },
        'get_procedures_history': { endpoint: '/analytics/procedures/history', method: 'GET' },
      },
      'ms-audit': {
        'get_savings_summary': { endpoint: '/analytics/savings', method: 'GET' },
        'get_audit_metrics': { endpoint: '/analytics/audit-metrics', method: 'GET' },
        'get_correction_analysis': { endpoint: '/analytics/corrections', method: 'GET' },
        'get_billing_analysis': { endpoint: '/analytics/billing', method: 'GET' },
      },
      'ms-contracts': {
        'get_contract_by_operadora': { endpoint: '/contracts/by-operadora', method: 'GET' },
        'get_contract_items': { endpoint: '/contracts', method: 'GET' },
        'get_procedure_price': { endpoint: '/contracts', method: 'GET' },
        'get_contract_summary': { endpoint: '/contracts', method: 'GET' },
        'list_contracts_by_operadora': { endpoint: '/contracts/operadora', method: 'GET' },
      },
    };

    const mapping = toolMap[service]?.[tool];
    if (!mapping) {
      throw new Error(`Tool ${tool} não encontrada no serviço ${service}`);
    }

    // Construir URL com parâmetros path quando necessário
    let url = `${baseUrl}${mapping.endpoint}`;
    
    // Para endpoints com parâmetros path, substituir placeholders
    if (service === 'ms-contracts') {
      if (tool === 'get_contract_by_operadora') {
        url = `${baseUrl}/contracts/by-operadora/${args.operadoraNome}`;
        return { url, params: {} };
      } else if (tool === 'get_contract_items') {
        url = `${baseUrl}/contracts/${args.contratoId}/items`;
        return { url, params: { page: args.page, limit: args.limit } };
      } else if (tool === 'get_procedure_price') {
        url = `${baseUrl}/contracts/${args.contratoId}/items/${args.codigoTUSS}/price`;
        return { url, params: {} };
      } else if (tool === 'get_contract_summary') {
        url = `${baseUrl}/contracts/${args.contratoId}/summary`;
        return { url, params: {} };
      } else if (tool === 'list_contracts_by_operadora') {
        url = `${baseUrl}/contracts/operadora/${args.operadoraNome}`;
        return { url, params: {} };
      }
    }
    
    return {
      url,
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
