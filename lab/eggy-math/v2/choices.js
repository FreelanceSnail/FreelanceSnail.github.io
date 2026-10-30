// Original deterministic choices; all choices are distinct nonnegative integers.
export function buildChoices(question, seed = 0) {
  const answer = question.answer;
  const candidates = [question.firstResult, answer + 1, answer > 0 ? answer - 1 : answer + 2, answer + 10, Math.max(0, answer - 10)];
  const out = [answer];
  for (const value of candidates) if (Number.isSafeInteger(value) && value >= 0 && !out.includes(value) && out.length < 3) out.push(value);
  const offset = (Number(seed) >>> 0) % 3;
  return out.slice(offset).concat(out.slice(0, offset));
}
