import { logger } from '../config/logger';

export interface MCPMapping {
  service: string;
  tool: string;
  arguments: Record<string, any>;
  keywords: string[];
  description: string;
}

export class MCPMapperService {
  private mappings: MCPMapping[] = [
    // MS-GUIDE Mappings
    {
      service: 'ms-guide',
      tool: 'get_daily_guides_summary',
      arguments: { period: 'day' },
      keywords: ['hoje', 'diário', 'agora', 'atual'],
      description: 'Resumo diário de guias (finalizadas, em andamento, canceladas)'
    },
    {
      service: 'ms-guide',
      tool: 'get_guides_revenue',
      arguments: { period: 'month' },
      keywords: ['receita', 'faturamento', 'valor', 'ganho', 'rendimento'],
      description: 'Receita de guias no período'
    },
    {
      service: 'ms-guide',
      tool: 'get_guides_by_status',
      arguments: { status: 'FINALIZADA' },
      keywords: ['status', 'finalizada', 'finalizadas', 'cancelada', 'canceladas'],
      description: 'Guias filtradas por status'
    },
    {
      service: 'ms-guide',
      tool: 'get_guides_by_operator',
      arguments: { operatorName: '' },
      keywords: ['operadora', 'operador', 'unimed', 'amil', 'bradesco', 'sulamerica'],
      description: 'Guias de uma operadora específica'
    },
    {
      service: 'ms-guide',
      tool: 'get_guides_history',
      arguments: {},
      keywords: ['histórico', 'historico', 'passado', 'todas', 'todas as guias', 'guias anteriores', 'guias antigas', 'guia', 'guias', 'finalizada', 'finalizadas', 'andamento', 'cancelada', 'canceladas', 'total', 'quantas'],
      description: 'Histórico completo de todas as guias (passado e presente)'
    },

    // MS-PROCEDURES Mappings
    {
      service: 'ms-procedures',
      tool: 'get_top_procedures',
      arguments: { limit: 10 },
      keywords: ['procedimento', 'procedimentos', 'mais realizados', 'top', 'principal', 'frequente'],
      description: 'Procedimentos mais realizados'
    },
    {
      service: 'ms-procedures',
      tool: 'get_procedures_statistics',
      arguments: { period: 'month' },
      keywords: ['procedimento', 'estatística', 'estatísticas', 'quantidade', 'total'],
      description: 'Estatísticas de procedimentos'
    },
    {
      service: 'ms-procedures',
      tool: 'get_efficiency_metrics',
      arguments: {},
      keywords: ['eficiência', 'eficiente', 'performance', 'pontualidade', 'utilização', 'sala'],
      description: 'Métricas de eficiência (pontualidade, utilização de sala)'
    },
    {
      service: 'ms-procedures',
      tool: 'get_category_analysis',
      arguments: {},
      keywords: ['categoria', 'categorias', 'tipo', 'tipos', 'cirurgia'],
      description: 'Análise de procedimentos por categoria'
    },
    {
      service: 'ms-procedures',
      tool: 'get_procedures_by_period',
      arguments: { period: 'month' },
      keywords: ['período', 'mês', 'semana', 'ano'],
      description: 'Procedimentos por período'
    },
    {
      service: 'ms-procedures',
      tool: 'get_procedures_history',
      arguments: {},
      keywords: ['procedimento', 'procedimentos', 'histórico', 'historico', 'passado', 'todas', 'todos os procedimentos', 'procedimentos anteriores', 'procedimentos antigos', 'total', 'quantos', 'quantas', 'realizados', 'realizado'],
      description: 'Histórico completo de todos os procedimentos realizados'
    },

    // MS-AUDIT Mappings
    {
      service: 'ms-audit',
      tool: 'get_savings_summary',
      arguments: { period: 'month' },
      keywords: ['economia', 'economizar', 'saving', 'savings', 'correção', 'correções', 'desconto'],
      description: 'Economia com correções de auditoria'
    },
    {
      service: 'ms-audit',
      tool: 'get_audit_metrics',
      arguments: { period: 'month' },
      keywords: ['auditoria', 'auditado', 'auditadas', 'métrica', 'métricas'],
      description: 'Métricas gerais de auditoria'
    },
    {
      service: 'ms-audit',
      tool: 'get_correction_analysis',
      arguments: {},
      keywords: ['correção', 'correções', 'análise', 'detalhado'],
      description: 'Análise detalhada de correções'
    },
    {
      service: 'ms-audit',
      tool: 'get_billing_analysis',
      arguments: { period: 'month' },
      keywords: ['faturamento', 'faturada', 'faturadas', 'billing'],
      description: 'Análise de faturamento'
    },

    // MS-CONTRACTS Mappings
    {
      service: 'ms-contracts',
      tool: 'list_contracts_by_operadora',
      arguments: { operadoraNome: '' },
      keywords: ['contrato', 'operadora', 'unimed', 'amil', 'bradesco', 'particular', 'hospital', '9', 'julho', 'h9j', 'nove'],
      description: 'Contratos de uma operadora'
    },
    {
      service: 'ms-contracts',
      tool: 'get_contract_items',
      arguments: { page: 1, limit: 50 },
      keywords: ['item', 'itens', 'contrato'],
      description: 'Itens de um contrato'
    },
    {
      service: 'ms-contracts',
      tool: 'get_procedure_price',
      arguments: { codigoTUSS: '' },
      keywords: ['preço', 'valor', 'contratado', 'tuss'],
      description: 'Valor contratado de um procedimento'
    },
    {
      service: 'ms-contracts',
      tool: 'get_contract_summary',
      arguments: {},
      keywords: ['resumo', 'contrato'],
      description: 'Resumo do contrato com estatísticas'
    },
  ];

  mapQuestionToMCPs(question: string): MCPMapping[] {
    const lowerQuestion = question.toLowerCase();
    const words = lowerQuestion.split(/\s+/);

    logger.info(`[MCPMapper] Mapeando pergunta: "${question}"`);

    const scoredMappings = this.mappings.map(mapping => {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of mapping.keywords) {
        for (const word of words) {
          if (word === keyword) {
            score += 10;
            matchedKeywords.push(keyword);
          } else if (word.includes(keyword) && keyword.length > 3) {
            score += 5;
            matchedKeywords.push(keyword);
          }
        }
      }

      if (matchedKeywords.includes('receita') || matchedKeywords.includes('faturamento')) {
        score += 3;
      }
      if (matchedKeywords.includes('economia') || matchedKeywords.includes('saving')) {
        score += 3;
      }
      if (matchedKeywords.includes('eficiência') || matchedKeywords.includes('performance')) {
        score += 3;
      }

      return {
        mapping,
        score,
        matchedKeywords: [...new Set(matchedKeywords)]
      };
    });

    const validMappings = scoredMappings.filter(m => m.score > 0);
    validMappings.sort((a, b) => b.score - a.score);

    logger.info(`[MCPMapper] Encontrados ${validMappings.length} MCP(s) correspondente(s)`);

    return validMappings.slice(0, 1).map(m => m.mapping);
  }

  extractParameters(question: string, mapping: MCPMapping): Record<string, any> {
    const lowerQuestion = question.toLowerCase();
    const args = { ...mapping.arguments };

    if (mapping.tool.includes('operadora') || mapping.keywords.includes('operadora')) {
      // Mapeamento de aliases para operadoras
      const operadoraAliases: Record<string, string> = {
        'unimed': 'unimed',
        'amil': 'amil',
        'bradesco': 'bradesco',
        'sulamerica': 'sulamerica',
        'particular': 'particular',
        'h9j': 'particular',
        'hospital 9 de julho': 'particular',
        'hospital nove de julho': 'particular',
        'nove de julho': 'particular',
        '9 de julho': 'particular',
      };
      
      for (const [alias, operadora] of Object.entries(operadoraAliases)) {
        if (lowerQuestion.includes(alias)) {
          args.operadoraNome = operadora;
          break;
        }
      }
    }

    if (lowerQuestion.includes('hoje') || lowerQuestion.includes('diário')) {
      args.period = 'day';
    } else if (lowerQuestion.includes('semana')) {
      args.period = 'week';
    } else if (lowerQuestion.includes('mês') || lowerQuestion.includes('mensal')) {
      args.period = 'month';
    } else if (lowerQuestion.includes('ano') || lowerQuestion.includes('anual')) {
      args.period = 'year';
    }

    if (lowerQuestion.includes('finalizada') || lowerQuestion.includes('finalizadas')) {
      args.status = 'FINALIZADA';
    } else if (lowerQuestion.includes('andamento')) {
      args.status = 'EM_ANDAMENTO';
    } else if (lowerQuestion.includes('cancelada') || lowerQuestion.includes('canceladas')) {
      args.status = 'CANCELADA';
    }

    return args;
  }

  getCapabilities(): string[] {
    const capabilities = [
      '📊 **Guias**: Quantas guias foram finalizadas? Qual a receita? Status das guias?',
      '🏥 **Procedimentos**: Quais são os procedimentos mais realizados? Estatísticas de procedimentos?',
      '💰 **Auditoria**: Quanto economizei com correções? Análise de faturamento?',
      '📋 **Contratos**: Qual é o contrato da Unimed? Quais itens tem no contrato?',
      '🔍 **Busca Flexível**: Faça perguntas em linguagem natural - o assistente entenderá!',
    ];
    return capabilities;
  }

  generateWelcomeMessage(): string {
    const capabilities = this.getCapabilities();
    const message = `
👋 **Bem-vindo ao Assistente Lazarus!**

Sou seu assistente inteligente de análise hospitalar. Posso ajudá-lo com:

${capabilities.map((cap, i) => `${i + 1}. ${cap}`).join('\n')}

**Como usar:**
- Faça perguntas em linguagem natural
- Não precisa ser exato - entendo várias formas de perguntar
- Exemplos: "Quantas guias hoje?", "Qual a receita?", "Procedimentos mais feitos?"

**O que posso fazer:**
✅ Responder perguntas sobre dados e métricas
✅ Buscar informações em contratos
✅ Analisar auditoria e economia
✅ Fornecer estatísticas e relatórios

Qual é sua pergunta? 🤔
    `.trim();
    return message;
  }
}
