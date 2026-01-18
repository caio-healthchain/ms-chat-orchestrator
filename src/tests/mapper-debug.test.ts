import { MCPMapperService } from '../services/mcp-mapper.service';

const mapper = new MCPMapperService();

// Testes para entender o problema
const testQuestions = [
  "Quantas guias foram finalizadas?",
  "Qual é o histórico de guias?",
  "Mostre todas as guias",
  "Quantas guias eu tenho no total?",
  "Qual é o status das guias?",
  "Guias de hoje",
  "Guias do passado",
];

console.log("=== TESTE DO MAPEADOR DE MCPs ===\n");

testQuestions.forEach(question => {
  const result = mapper.mapQuestionToMCPs(question);
  console.log(`Pergunta: "${question}"`);
  console.log(`Resultado: ${JSON.stringify(result, null, 2)}`);
  console.log("---\n");
});
