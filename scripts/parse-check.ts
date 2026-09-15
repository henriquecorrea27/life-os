import { parseQuickAdd } from '../lib/quick-parse';

const cats = [
  { id: 'c1', name: 'Trabalho', color: '#60A5FA', icon: null, order: 0 },
  { id: 'c2', name: 'Trade', color: '#34D399', icon: null, order: 1 },
];

const cases = [
  'preparar apresentação sexta #trabalho !alta',
  'reunião na terça',
  'pagar boleto dia 20',
  'consulta 03/11',
  'relatório próxima semana',
  'revisar trades de hoje',
  'academia todos os dias úteis',
  'estudar depois de amanhã',
];

for (const input of cases) {
  const r = parseQuickAdd(input, cats);
  console.log(
    JSON.stringify(input).padEnd(48),
    '=>',
    JSON.stringify({ title: r.title, due: r.dueDate, prio: r.priority, rec: r.recurrence }),
  );
}
