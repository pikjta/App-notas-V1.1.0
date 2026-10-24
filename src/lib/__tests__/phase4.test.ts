import { describe, expect, it } from 'vitest';
import { explainError, mapRefs } from '../formula';
import { newCol, pmReduce, pmTemplate, colLetter, displayExpr, storeExpr, formulaValue, rowNumber } from '../pm';
import type { Pm } from '../pm';
import { calcCell, cellName, isFormula, showValue } from '../tablecalc';

/** Tabla PM sencilla: A = Nombre (texto), B = Precio (número), C = Cantidad (número), D = fórmula. */
function sample(expr: string): Pm {
  let pm: Pm = { ...pmTemplate(), cols: [], rows: [], views: pmTemplate().views };
  const mk = (type: 'text' | 'number' | 'formula', name: string, extra: object = {}) => { pm = pmReduce(pm, { op: 'addCol', col: { ...newCol(type, pm), id: 'c' + name, name, ...extra } }); };
  mk('text', 'Nombre'); mk('number', 'Precio'); mk('number', 'Cantidad');
  for (const [id, n, p, q] of [['r1', 'a', 10, 2], ['r2', 'b', 20, 3], ['r3', 'c', 30, 4]] as const) {
    pm = pmReduce(pm, { op: 'addRow', id });
    pm = pmReduce(pm, { op: 'cell', row: id, col: 'cNombre', value: n });
    pm = pmReduce(pm, { op: 'cell', row: id, col: 'cPrecio', value: p });
    pm = pmReduce(pm, { op: 'cell', row: id, col: 'cCantidad', value: q });
  }
  mk('formula', 'Calc', { expr: '', fmt: 'num' });
  pm = pmReduce(pm, { op: 'patchCol', id: pm.cols[3].id, patch: { expr: storeExpr(pm, expr) } });
  return pm;
}
const val = (pm: Pm, row = 0) => formulaValue(pm, pm.cols.find((c) => c.name === 'Calc')!, pm.rows[row], []);

describe('referencias tipo Excel en la Tabla PM', () => {
  it('letras de columna y números de fila', () => {
    expect([0, 1, 25, 26, 27].map(colLetter)).toEqual(['A', 'B', 'Z', 'AA', 'AB']);
  });
  it('B2 apunta a una celda fija; B2:B3 y B:B son rangos dentro de funciones', () => {
    expect(val(sample('B2 * 2')).value).toBe(40);
    expect(val(sample('suma(B2:C3)')).value).toBe(20 + 3 + 30 + 4);
    expect(val(sample('suma(B:B)')).value).toBe(60);
    expect(val(sample('promedio(B1:B3)')).value).toBe(20);
    expect(val(sample('contar(B:B)')).value).toBe(3);
    expect(val(sample('max(B:C)')).value).toBe(30);
    expect(val(sample('{B} * {C}'), 2).value).toBe(120); // {B} = la columna B de la misma fila
  });
  it('se guarda por identidad: reordenar filas o columnas no cambia la celda a la que apunta', () => {
    let pm = sample('B2 + C3');
    expect(pm.cols.find((c) => c.name === 'Calc')!.expr).toBe('{#cPrecio:r2} + {#cCantidad:r3}');
    expect(val(pm).value).toBe(24);
    pm = pmReduce(pm, { op: 'moveRow', id: 'r2', before: null } as never);
    expect(rowNumber(pm, 'r2')).toBe(3);
    expect(val(pm).value).toBe(24); // sigue siendo el Precio de «b»
    expect(displayExpr(pm, pm.cols.find((c) => c.name === 'Calc')!.expr!)).toBe('B3 + C2');
  });
  it('si se borra la fila, el error lo explica y se muestra #REF', () => {
    let pm = sample('B2 * 2');
    pm = pmReduce(pm, { op: 'removeRow', id: 'r2' });
    const r = val(pm);
    expect(r.error).toContain('ya no existe');
    expect(displayExpr(pm, pm.cols.find((c) => c.name === 'Calc')!.expr!)).toBe('#REF * 2');
    expect(explainError(r.error!).title).toContain('no existe');
  });
  it('detecta círculos y celdas fuera de la tabla', () => {
    expect(val(sample('suma(B:D)')).error).toContain('circular');
    expect(val(sample('B9')).error).toContain('No existe la fila 9');
    expect(val(sample('Z1')).error).toContain('No existe la columna Z');
    expect(val(sample('B2:B3')).error).toContain('dentro de una función');
  });
  it('mapRefs no toca el texto entre comillas ni los nombres de funciones', () => {
    expect(mapRefs('concat("B2", B2) + round(1)', (r) => (r.k === 'ref' ? '<' + r.col + r.row + '>' : null))).toBe('concat("B2", <B2>) + round(1)');
  });
});

describe('operaciones en la tarjeta Tabla', () => {
  const t = { heads: ['Producto', 'Precio', 'Cant.', 'Total'], rows: [
    { id: 'a', cells: ['Lápiz', '2,5', '4', '=B2*C2'] },
    { id: 'b', cells: ['Cuaderno', '10', '3', '=B3*C3'] },
    { id: 'c', cells: ['', '', '', '=suma(D2:D3)'] },
  ] };
  it('las celdas con «=» se calculan; A1 es la cabecera', () => {
    expect(isFormula('=1')).toBe(true);
    expect(cellName(-1, 0)).toBe('A1');
    expect(cellName(0, 3)).toBe('D2');
    expect(calcCell(t, 0, 3).value).toBe(10);
    expect(showValue(calcCell(t, 2, 3).value)).toBe('40');
    expect(showValue(calcCell({ ...t, rows: [{ id: 'x', cells: ['', '', '', '=B1+0,5'] }] }, 0, 3).value)).toBe('');
  });
  it('rangos, columna entera y funciones en español', () => {
    const g = { heads: ['A', 'B'], rows: [{ id: '1', cells: ['x', '1'] }, { id: '2', cells: ['y', '2,5'] }, { id: '3', cells: ['=promedio(B:B)', ''] }] };
    expect(calcCell(g, 2, 0).value).toBe(1.75);
    expect(calcCell({ ...g, rows: [{ id: '1', cells: ['', '=si(1>0;"sí";"no")'] }] }, 0, 1).value).toBe('sí');
  });
  it('errores: círculo, fuera de la tabla, texto en una cuenta', () => {
    const e = (cells: string[]) => calcCell({ heads: ['A', 'B'], rows: [{ id: '1', cells }] }, 0, 1).error;
    expect(e(['', '=B2'])).toContain('circular');
    expect(e(['', '=A9'])).toContain('No existe la fila 9');
    expect(e(['hola', '=A2*2'])).toContain('no es un número');
    expect(e(['1', '=A2/0'])).toContain('cero');
  });
});
