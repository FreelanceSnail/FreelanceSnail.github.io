/* Original, offline mathematics engine. No requests or third-party dependencies. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathEngine = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const TOPICS = ['length', 'share', 'mixed'];
  const STORE_KEY = 'egg-math-islands-mixed-v2';
  const uint = n => Number.isInteger(n) && n >= 0 && n <= 4294967295;
  function normalizeSeed(seed) { return Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 1; }
  function random(seed) {
    let x = normalizeSeed(seed);
    return function () {
      x = (x + 0x6D2B79F5) | 0;
      let t = Math.imul(x ^ (x >>> 15), 1 | x);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generateRound(seed, topics = ['mixed']) {
    seed = normalizeSeed(seed);
    topics = Array.isArray(topics) ? [...new Set(topics.filter(t => TOPICS.includes(t)))] : TOPICS;
    if (!topics.length) topics = TOPICS;
    const rng = random(seed), pick = arr => arr[Math.floor(rng() * arr.length)];
    const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const shares = [];
    for (let meters = 1; meters <= 8; meters++) for (let parts = 2; parts <= 9; parts++) {
      if ((meters * 10) % parts === 0 && meters * 10 / parts <= 9) shares.push({meters, parts});
    }
    return Array.from({length: 5}, (_, index) => {
      const kind = topics[index % topics.length];
      const q = {id: `${seed}-${index}-${kind}`, kind};
      if (kind === 'length') {
        const fromValue = int(1, 9), fromUnit = pick(['m', 'dm']);
        const toUnit = fromUnit === 'm' ? 'dm' : 'cm';
        const fromName = fromUnit === 'm' ? '米' : '分米', toName = toUnit === 'dm' ? '分米' : '厘米';
        Object.assign(q, {
          title: '搭好彩虹桥', prompt: `彩虹桥长 ${fromValue} ${fromName}，也就是多少${toName}？`,
          answer: fromValue * 10, unit: toUnit,
          explanation: `1 ${fromName} = 10 ${toName}。${fromValue} 个 10 是 ${fromValue * 10}，所以 ${fromValue} ${fromName} = ${fromValue * 10} ${toName}。`,
          visual: {type: 'ruler', fromValue, fromUnit, toUnit, factor: 10},
          operands: {fromValue, fromUnit, toUnit, factor: 10}
        });
      } else if (kind === 'share') {
        const {meters, parts} = pick(shares), totalDm = meters * 10, answer = totalDm / parts;
        Object.assign(q, {
          title: '分一分彩带', prompt: `把 ${meters} 米长的彩带平均分成 ${parts} 份，每份长多少分米？`, answer, unit: 'dm',
          explanation: `先统一单位：${meters} 米 = ${totalDm} 分米。再平均分：${totalDm} ÷ ${parts} = ${answer}。每份是 ${answer} 分米，不是 ${answer} 米。`,
          visual: {type: 'share', meters, parts, totalDm}, operands: {meters, parts, totalDm}
        });
      } else {
        const patterns = [pick(['addSubtract', 'subtractAdd']), 'multiplyDivide', 'plusTimes', pick(['bracketTimes', 'bracketDivide']), 'plusDivide'];
        const operator = patterns[index];
        let a, b, c, expression, answer, firstExpression, firstResult, secondExpression, decoyExpression, rule;
        if (operator === 'addSubtract') {
          a = int(1, 30); b = int(1, 30); c = int(1, Math.min(30, a + b));
          expression = `${a} + ${b} − ${c}`; firstExpression = `${a} + ${b}`; firstResult = a + b;
          secondExpression = `${firstResult} − ${c}`; answer = firstResult - c; decoyExpression = `${b} − ${c}`;
          rule = '只有加减，按从左到右的顺序计算。';
        } else if (operator === 'subtractAdd') {
          a = int(2, 40); b = int(1, a); c = int(1, 30);
          expression = `${a} − ${b} + ${c}`; firstExpression = `${a} − ${b}`; firstResult = a - b;
          secondExpression = `${firstResult} + ${c}`; answer = firstResult + c; decoyExpression = `${b} + ${c}`;
          rule = '只有加减，按从左到右的顺序计算。';
        } else if (operator === 'multiplyDivide') {
          a = int(1, 9); b = int(1, 9);
          c = pick(Array.from({length: 9}, (_, i) => i + 1).filter(n => a * b % n === 0 && a * b / n <= 9));
          expression = `${a} × ${b} ÷ ${c}`; firstExpression = `${a} × ${b}`; firstResult = a * b;
          secondExpression = `${firstResult} ÷ ${c}`; answer = firstResult / c; decoyExpression = `${b} ÷ ${c}`;
          rule = '只有乘除，按从左到右的顺序计算。';
        } else if (operator === 'plusTimes') {
          a = int(1, 30); b = int(1, 9); c = int(1, 9);
          expression = `${a} + ${b} × ${c}`; firstExpression = `${b} × ${c}`; firstResult = b * c;
          secondExpression = `${a} + ${firstResult}`; answer = a + firstResult; decoyExpression = `${a} + ${b}`;
          rule = '没有括号，先算乘除，再算加减。';
        } else if (operator === 'bracketTimes') {
          a = int(1, 8); b = int(1, 9 - a); c = int(1, 9);
          expression = `(${a} + ${b}) × ${c}`; firstExpression = `${a} + ${b}`; firstResult = a + b;
          secondExpression = `${firstResult} × ${c}`; answer = firstResult * c; decoyExpression = `${b} × ${c}`;
          rule = '有小括号，先算小括号里面的。';
        } else if (operator === 'bracketDivide') {
          c = int(1, 9); const quotient = int(2, 9); const total = c * quotient;
          a = int(1, total - 1); b = total - a;
          expression = `(${a} + ${b}) ÷ ${c}`; firstExpression = `${a} + ${b}`; firstResult = a + b;
          secondExpression = `${firstResult} ÷ ${c}`; answer = quotient; decoyExpression = `${b} ÷ ${c}`;
          rule = '有小括号，先算小括号里面的。';
        } else {
          a = int(1, 30); c = int(1, 9); b = int(1, 9) * c;
          expression = `${a} + ${b} ÷ ${c}`; firstExpression = `${b} ÷ ${c}`; firstResult = b / c;
          secondExpression = `${a} + ${firstResult}`; answer = a + firstResult; decoyExpression = `${a} + ${b}`;
          rule = '没有括号，先算乘除，再算加减。';
        }
        Object.assign(q, {
          title: '点亮星星工厂', prompt: `${expression} = ?`, answer, unit: '',
          explanation: `${rule}先算 ${firstExpression} = ${firstResult}，再算 ${secondExpression} = ${answer}。`,
          visual: {type: 'mixed', a, b, c, operator, expression, firstExpression, firstResult, secondExpression, decoyExpression, rule},
          operands: {a, b, c, operator}, expression, firstExpression, firstResult, secondExpression, decoyExpression, rule
        });
      }
      return q;
    });
  }
  function check(question, value, unit = '') {
    const str = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
    const valid = /^\d+$/.test(str) && Number.isSafeInteger(Number(str));
    const numberCorrect = valid && Number(str) === question.answer;
    const unitCorrect = typeof unit === 'string' && unit.trim() === question.unit;
    return {correct: numberCorrect && unitCorrect, numberCorrect, unitCorrect, valid};
  }
  function cleanProgress(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    const count = n => Number.isSafeInteger(n) && n >= 0 ? Math.min(n, 1000000000) : 0;
    const ref = r => r && uint(r.seed) && Number.isInteger(r.index) && r.index >= 0 && r.index < 5;
    const seen = new Set();
    const mistakes = (Array.isArray(raw.mistakes) ? raw.mistakes : []).filter(ref).filter(r => {
      const key = `${r.seed}-${r.index}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(-100).map(r => ({seed: r.seed, index: r.index}));
    const a = raw.active;
    const active = a && uint(a.seed) && Number.isInteger(a.index) && a.index >= 0 && a.index <= 5 && ['normal', 'review'].includes(a.mode)
      ? {seed: a.seed, index: a.index, solved: [...new Set((Array.isArray(a.solved) ? a.solved : []).filter(i => Number.isInteger(i) && i >= 0 && i < 5))], mode: a.mode}
      : null;
    return {rounds: count(raw.rounds), stars: count(raw.stars), mistakes, active};
  }
  function createStore(storage) {
    let available = true;
    let memory = cleanProgress(null);
    return {
      get available() { return available; },
      load() {
        try {
          const raw = storage.getItem(STORE_KEY);
          memory = cleanProgress(raw ? JSON.parse(raw) : null);
        } catch (_) { available = false; }
        return cleanProgress(memory);
      },
      save(progress) {
        memory = cleanProgress(progress);
        try { storage.setItem(STORE_KEY, JSON.stringify(memory)); return true; }
        catch (_) { available = false; return false; }
      }
    };
  }
  return {generateRound, check, createStore, cleanProgress, normalizeSeed, TOPICS: [...TOPICS], STORE_KEY};
});
