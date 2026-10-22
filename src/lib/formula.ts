// Fórmulas de la Tabla PM. Lenguaje pequeño y seguro (no usa eval): se analiza el texto y se
// evalúa el árbol resultante. Las propiedades se citan como {Nombre} o prop("Nombre").
//
//   {Presupuesto} * 1.21
//   if({Facturado}, "Cobrar", "Pendiente")
//   round({Horas} * 35, 2)
//   dateBetween({Fin}, today(), "days")
//   concat({Cliente}, " · ", {Tarea})

export type FVal = number | string | boolean | null;
export class FormulaError extends Error {}

type Node =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'bool'; v: boolean }
  | { k: 'prop'; name: string }
  | { k: 'call'; fn: string; args: Node[] }
  | { k: 'un'; op: '-' | '!'; a: Node }
  | { k: 'bin'; op: string; a: Node; b: Node };

type Tok = { t: 'num' | 'str' | 'id' | 'prop' | 'op' | '(' | ')' | ','; v: string; at: number };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c) && /[0-9]/.test(src[i] === '.' ? src[i + 1] ?? '' : c)) {
      let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ t: 'num', v: src.slice(i, j), at: i }); i = j; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1, s = '';
      while (j < src.length && src[j] !== c) { if (src[j] === '\\' && j + 1 < src.length) { s += src[j + 1]; j += 2; } else s += src[j++]; }
      if (j >= src.length) throw new FormulaError('Falta cerrar unas comillas.');
      out.push({ t: 'str', v: s, at: i }); i = j + 1; continue;
    }
    if (c === '{') {
      const j = src.indexOf('}', i);
      if (j < 0) throw new FormulaError('Falta cerrar una llave «}».');
      out.push({ t: 'prop', v: src.slice(i + 1, j).trim(), at: i }); i = j + 1; continue;
    }
    if (/[A-Za-zÁÉÍÓÚáéíóúÑñ_]/.test(c)) {
      let j = i; while (j < src.length && /[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ_]/.test(src[j])) j++;
      out.push({ t: 'id', v: src.slice(i, j), at: i }); i = j; continue;
    }
    const two = src.slice(i, i + 2);
    if (['==', '!=', '>=', '<=', '&&', '||'].includes(two)) { out.push({ t: 'op', v: two, at: i }); i += 2; continue; }
    if ('+-*/%<>=!'.includes(c)) { out.push({ t: 'op', v: c === '=' ? '==' : c, at: i }); i++; continue; }
    if (c === '(' || c === ')' || c === ',') { out.push({ t: c, v: c, at: i }); i++; continue; }
    throw new FormulaError(`Carácter no válido: «${c}».`);
  }
  return out;
}

function parse(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (...ops: string[]) => peek()?.t === 'op' && ops.includes(peek().v) || (peek()?.t === 'id' && ops.includes(peek().v.toLowerCase()));
  const take = () => toks[p++];
  const expect = (t: Tok['t']) => { const x = take(); if (!x || x.t !== t) throw new FormulaError(x ? `Se esperaba «${t}» y hay «${x.v}».` : `Se esperaba «${t}» al final.`); return x; };
  const or = (): Node => { let a = and(); while (isOp('||', 'or', 'o')) { take(); a = { k: 'bin', op: '||', a, b: and() }; } return a; };
  const and = (): Node => { let a = not(); while (isOp('&&', 'and', 'y')) { take(); a = { k: 'bin', op: '&&', a, b: not() }; } return a; };
  const not = (): Node => (isOp('!', 'not', 'no') ? (take(), { k: 'un', op: '!', a: not() }) : cmp());
  const cmp = (): Node => { const a = add(); if (isOp('==', '!=', '>', '<', '>=', '<=')) { const op = take().v; return { k: 'bin', op, a, b: add() }; } return a; };
  const add = (): Node => { let a = mul(); while (isOp('+', '-')) { const op = take().v; a = { k: 'bin', op, a, b: mul() }; } return a; };
  const mul = (): Node => { let a = unary(); while (isOp('*', '/', '%')) { const op = take().v; a = { k: 'bin', op, a, b: unary() }; } return a; };
  const unary = (): Node => (isOp('-') ? (take(), { k: 'un', op: '-', a: unary() }) : primary());
  const primary = (): Node => {
    const x = take();
    if (!x) throw new FormulaError('La fórmula está incompleta.');
    if (x.t === 'num') { const v = Number(x.v); if (isNaN(v)) throw new FormulaError(`Número no válido: «${x.v}».`); return { k: 'num', v }; }
    if (x.t === 'str') return { k: 'str', v: x.v };
    if (x.t === 'prop') return { k: 'prop', name: x.v };
    if (x.t === '(') { const e = or(); expect(')'); return e; }
    if (x.t === 'id') {
      const low = x.v.toLowerCase();
      if (low === 'true' || low === 'verdadero') return { k: 'bool', v: true };
      if (low === 'false' || low === 'falso') return { k: 'bool', v: false };
      if (peek()?.t !== '(') throw new FormulaError(`«${x.v}» no se reconoce. Para una propiedad escribe {${x.v}}.`);
      take();
      const args: Node[] = [];
      if (peek()?.t !== ')') { args.push(or()); while (peek()?.t === ',') { take(); args.push(or()); } }
      expect(')');
      if (low === 'prop') { if (args[0]?.k !== 'str') throw new FormulaError('prop() necesita el nombre entre comillas.'); return { k: 'prop', name: args[0].v }; }
      if (!(low in FNS)) throw new FormulaError(`Función desconocida: ${x.v}().`);
      return { k: 'call', fn: low, args };
    }
    throw new FormulaError(`Sobra «${x.v}».`);
  };
  if (!toks.length) throw new FormulaError('La fórmula está vacía.');
  const tree = or();
  if (p < toks.length) throw new FormulaError(`Sobra «${toks[p].v}».`);
  return tree;
}

const num = (v: FVal, fn: string): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === null || v === '') return 0;
  const n = Number(String(v).replace(',', '.'));
  if (isNaN(n)) throw new FormulaError(`${fn}: «${v}» no es un número.`);
  return n;
};
const str = (v: FVal): string => (v === null ? '' : typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6).replace('.', ',') : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : v);
const truthy = (v: FVal) => !(v === null || v === false || v === 0 || v === '');
const DAY = 86_400_000;
const dateMs = (v: FVal, fn: string) => { const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) throw new FormulaError(`${fn}: «${v ?? ''}» no es una fecha.`); return Date.UTC(+m[1], +m[2] - 1, +m[3]); };
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const FNS: Record<string, (a: FVal[], today: string) => FVal> = {
  if: (a) => (truthy(a[0]) ? a[1] ?? null : a[2] ?? null),
  round: (a) => { const k = 10 ** num(a[1] ?? 0, 'round'); return Math.round(num(a[0], 'round') * k) / k; },
  floor: (a) => Math.floor(num(a[0], 'floor')),
  ceil: (a) => Math.ceil(num(a[0], 'ceil')),
  abs: (a) => Math.abs(num(a[0], 'abs')),
  min: (a) => Math.min(...a.map((x) => num(x, 'min'))),
  max: (a) => Math.max(...a.map((x) => num(x, 'max'))),
  sum: (a) => a.reduce<number>((m, x) => m + num(x, 'sum'), 0),
  avg: (a) => (a.length ? a.reduce<number>((m, x) => m + num(x, 'avg'), 0) / a.length : 0),
  concat: (a) => a.map(str).join(''),
  length: (a) => str(a[0]).length,
  upper: (a) => str(a[0]).toUpperCase(),
  lower: (a) => str(a[0]).toLowerCase(),
  contains: (a) => str(a[0]).toLowerCase().includes(str(a[1]).toLowerCase()),
  empty: (a) => !truthy(a[0]),
  tonumber: (a) => num(a[0], 'toNumber'),
  format: (a) => str(a[0]),
  today: (_a, today) => today,
  datebetween: (a) => {
    const d = (dateMs(a[0], 'dateBetween') - dateMs(a[1], 'dateBetween')) / DAY;
    const u = str(a[2] ?? 'days').toLowerCase();
    return u.startsWith('week') || u.startsWith('sem') ? Math.trunc(d / 7) : u.startsWith('month') || u.startsWith('mes') ? Math.trunc(d / 30.44) : u.startsWith('year') || u.startsWith('año') ? Math.trunc(d / 365.25) : d;
  },
  dateadd: (a) => {
    const n = num(a[1], 'dateAdd'), u = str(a[2] ?? 'days').toLowerCase(), base = new Date(dateMs(a[0], 'dateAdd'));
    if (u.startsWith('month') || u.startsWith('mes')) base.setUTCMonth(base.getUTCMonth() + n);
    else if (u.startsWith('year') || u.startsWith('año')) base.setUTCFullYear(base.getUTCFullYear() + n);
    else base.setUTCDate(base.getUTCDate() + n * (u.startsWith('week') || u.startsWith('sem') ? 7 : 1));
    return iso(base.getTime());
  },
};

export const FUNCTION_HELP = 'if(cond, a, b) · round(x, n) · floor · ceil · abs · min · max · sum · avg · concat(…) · length · upper · lower · contains(texto, parte) · empty · toNumber · today() · dateBetween(a, b, "days"|"weeks"|"months") · dateAdd(fecha, n, "days")';

function evaluate(n: Node, get: (name: string) => FVal, today: string): FVal {
  switch (n.k) {
    case 'num': case 'str': case 'bool': return n.v;
    case 'prop': return get(n.name);
    case 'un': { const a = evaluate(n.a, get, today); return n.op === '-' ? -num(a, '-') : !truthy(a); }
    case 'call':
      // if() solo evalúa la rama que toca (así una rama con error no afecta a la otra).
      if (n.fn === 'if') return truthy(evaluate(n.args[0], get, today)) ? (n.args[1] ? evaluate(n.args[1], get, today) : null) : (n.args[2] ? evaluate(n.args[2], get, today) : null);
      return FNS[n.fn](n.args.map((x) => evaluate(x, get, today)), today);
    case 'bin': {
      if (n.op === '&&') return truthy(evaluate(n.a, get, today)) && truthy(evaluate(n.b, get, today));
      if (n.op === '||') return truthy(evaluate(n.a, get, today)) || truthy(evaluate(n.b, get, today));
      const a = evaluate(n.a, get, today), b = evaluate(n.b, get, today);
      switch (n.op) {
        case '+': return typeof a === 'string' || typeof b === 'string' ? str(a) + str(b) : num(a, '+') + num(b, '+');
        case '-': return num(a, '-') - num(b, '-');
        case '*': return num(a, '*') * num(b, '*');
        case '/': { const d = num(b, '/'); if (d === 0) throw new FormulaError('División entre cero.'); return num(a, '/') / d; }
        case '%': return num(a, '%') % num(b, '%');
        case '==': return a === b || str(a) === str(b);
        case '!=': return !(a === b || str(a) === str(b));
        case '>': return typeof a === 'string' && typeof b === 'string' ? a > b : num(a, '>') > num(b, '>');
        case '<': return typeof a === 'string' && typeof b === 'string' ? a < b : num(a, '<') < num(b, '<');
        case '>=': return typeof a === 'string' && typeof b === 'string' ? a >= b : num(a, '>=') >= num(b, '>=');
        case '<=': return typeof a === 'string' && typeof b === 'string' ? a <= b : num(a, '<=') <= num(b, '<=');
      }
    }
  }
  return null;
}

const cache = new Map<string, Node | FormulaError>();
/** Comprueba la sintaxis (para avisar al escribir la fórmula). Devuelve el error o null. */
export function checkFormula(src: string): string | null {
  try { compile(src); return null; } catch (e) { return (e as Error).message; }
}
function compile(src: string): Node {
  let c = cache.get(src);
  if (!c) { try { c = parse(src); } catch (e) { c = e instanceof FormulaError ? e : new FormulaError('Fórmula no válida.'); } if (cache.size > 500) cache.clear(); cache.set(src, c); }
  if (c instanceof FormulaError) throw c;
  return c;
}

/** Evalúa una fórmula. `get` devuelve el valor de una propiedad por su nombre. */
export function runFormula(src: string, get: (name: string) => FVal, today: string): FVal {
  return evaluate(compile(src), get, today);
}

/** Nombres de propiedades usados en una fórmula (para detectar referencias a columnas que no existen). */
export function propsIn(src: string): string[] {
  try { const out: string[] = []; const walk = (n: Node) => { if (n.k === 'prop') out.push(n.name); if (n.k === 'call') n.args.forEach(walk); if (n.k === 'un') walk(n.a); if (n.k === 'bin') { walk(n.a); walk(n.b); } }; walk(compile(src)); return out; } catch { return []; }
}
