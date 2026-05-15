// ATENÇÃO: Esta é uma lista de exemplo, não exaustiva.
// Para um sistema em produção, considere usar uma biblioteca ou API especializada.
const badWords = [
  'palavra1', 'palavra2', 'palavra3', // Substitua por palavras reais
  'obsceno', 'improprio', 'chulo'
];

const wordRegex = new RegExp(badWords.join('|'), 'gi');

export const censorText = (text: string): string => {
  if (!text) return '';

  return text.replace(wordRegex, (match) => {
    return match.charAt(0) + '*'.repeat(match.length - 1);
  });
};
