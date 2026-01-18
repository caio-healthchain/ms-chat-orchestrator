import { ClassifierService } from '../services/classifier.service';
import { MCPMapperService } from '../services/mcp-mapper.service';
import { OpenAI } from 'openai';

/**
 * Suite de Testes para o Classificador e Mapeador de MCPs
 */

const classifier = new ClassifierService();
const mapper = new MCPMapperService();

const testCases = [
  // Saudações
  {
    question: 'Olá',
    expectedType: 'greeting',
    description: 'Saudação simples'
  },
  {
    question: 'Oi, tudo bem?',
    expectedType: 'greeting',
    description: 'Saudação com pergunta'
  },

  // Perguntas sobre Guias
  {
    question: 'Quantas guias foram finalizadas?',
    expectedMCP: 'ms-guide',
    expectedTool: 'get_daily_guides_summary',
    description: 'Pergunta sobre guias finalizadas'
  },
  {
    question: 'Qual foi a receita de guias hoje?',
    expectedMCP: 'ms-guide',
    expectedTool: 'get_guides_revenue',
    description: 'Pergunta sobre receita de guias'
  },
  {
    question: 'Qual é o status das guias?',
    expectedMCP: 'ms-guide',
    expectedTool: 'get_guides_by_status',
    description: 'Pergunta sobre status de guias'
  },

  // Perguntas sobre Procedimentos
  {
    question: 'Quais foram os procedimentos mais realizados?',
    expectedMCP: 'ms-procedures',
    expectedTool: 'get_top_procedures',
    description: 'Pergunta sobre procedimentos mais realizados'
  },
  {
    question: 'Qual é a estatística de procedimentos?',
    expectedMCP: 'ms-procedures',
    expectedTool: 'get_procedures_statistics',
    description: 'Pergunta sobre estatísticas de procedimentos'
  },
  {
    question: 'Como está a eficiência?',
    expectedMCP: 'ms-procedures',
    expectedTool: 'get_efficiency_metrics',
    description: 'Pergunta sobre métricas de eficiência'
  },

  // Perguntas sobre Auditoria
  {
    question: 'Quanto eu tive de economia com correções?',
    expectedMCP: 'ms-audit',
    expectedTool: 'get_savings_summary',
    description: 'Pergunta sobre economia'
  },
  {
    question: 'Qual é a análise de faturamento?',
    expectedMCP: 'ms-audit',
    expectedTool: 'get_billing_analysis',
    description: 'Pergunta sobre faturamento'
  },

  // Perguntas sobre Contratos
  {
    question: 'Qual é o contrato da Unimed?',
    expectedMCP: 'ms-contracts',
    expectedTool: 'get_contract_by_operadora',
    description: 'Pergunta sobre contrato de operadora'
  },
  {
    question: 'Quais itens tem no contrato?',
    expectedMCP: 'ms-contracts',
    expectedTool: 'get_contract_items',
    description: 'Pergunta sobre itens do contrato'
  },
];

async function runTests() {
  console.log('🧪 SUITE DE TESTES - CLASSIFICADOR E MAPEADOR DE MCPs');
  console.log('═'.repeat(80));
  console.log(`Data: ${new Date().toISOString()}`);
  console.log('═'.repeat(80));

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Testando: ${testCase.description}`);
    console.log(`   Pergunta: "${testCase.question}"`);

    try {
      if (testCase.expectedType === 'greeting') {
        // Testar saudação
        const classification = await classifier.classifyQuestion(testCase.question);
        if (classification.toolCalls && classification.toolCalls.length === 0) {
          console.log(`   ✅ PASSOU - Identificada como saudação`);
          passedTests++;
        } else {
          console.log(`   ❌ FALHOU - Não foi identificada como saudação`);
          failedTests++;
        }
      } else {
        // Testar mapeamento de MCP
        const mappedMCPs = mapper.mapQuestionToMCPs(testCase.question);
        
        if (mappedMCPs.length === 0) {
          console.log(`   ❌ FALHOU - Nenhum MCP mapeado`);
          failedTests++;
        } else {
          const firstMCP = mappedMCPs[0];
          const serviceMatch = firstMCP.service === testCase.expectedMCP;
          const toolMatch = firstMCP.tool === testCase.expectedTool;

          if (serviceMatch && toolMatch) {
            console.log(`   ✅ PASSOU - MCP correto: ${firstMCP.service}/${firstMCP.tool}`);
            passedTests++;
          } else {
            console.log(`   ❌ FALHOU - MCP incorreto`);
            console.log(`      Esperado: ${testCase.expectedMCP}/${testCase.expectedTool}`);
            console.log(`      Obtido: ${firstMCP.service}/${firstMCP.tool}`);
            failedTests++;
          }
        }
      }
    } catch (error: any) {
      console.log(`   ❌ ERRO: ${error.message}`);
      failedTests++;
    }
  }

  // Teste de boas-vindas
  console.log(`\n📋 Testando: Mensagem de boas-vindas`);
  try {
    const welcomeMessage = classifier.getWelcomeMessage();
    if (welcomeMessage && welcomeMessage.length > 0) {
      console.log(`   ✅ PASSOU - Mensagem de boas-vindas gerada`);
      console.log(`   Comprimento: ${welcomeMessage.length} caracteres`);
      passedTests++;
    } else {
      console.log(`   ❌ FALHOU - Mensagem de boas-vindas vazia`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ ERRO: ${error.message}`);
    failedTests++;
  }

  // Teste de capacidades
  console.log(`\n📋 Testando: Capacidades do chat`);
  try {
    const capabilities = classifier.getCapabilities();
    if (capabilities && capabilities.length > 0) {
      console.log(`   ✅ PASSOU - ${capabilities.length} capacidades listadas`);
      capabilities.forEach((cap, i) => {
        console.log(`      ${i + 1}. ${cap}`);
      });
      passedTests++;
    } else {
      console.log(`   ❌ FALHOU - Nenhuma capacidade listada`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`   ❌ ERRO: ${error.message}`);
    failedTests++;
  }

  // Resumo
  console.log('\n\n📊 RESUMO DOS TESTES');
  console.log('═'.repeat(80));
  console.log(`✅ Testes passados: ${passedTests}`);
  console.log(`❌ Testes falhados: ${failedTests}`);
  console.log(`📈 Taxa de sucesso: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
  console.log('═'.repeat(80));
}

// Executar testes
runTests().catch(console.error);
