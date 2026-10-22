import { useLayoutEffect, useRef } from 'react';
import { useApp } from '../../App';
import type { TableCard } from '../../lib/model';
import { uid } from '../../lib/model';

export function TableBody({ card }: { card: TableCard }) {
  const { dispatch } = useApp();
  const pending = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (pending.current) { document.getElementById(pending.current)?.focus(); pending.current = null; }
  }, [card.rows]);
  const focusCell = (row: string, col: number) => {
    const id = `cell-${row}-${col}`;
    const el = document.getElementById(id);
    if (el) el.focus(); else pending.current = id;
  };
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {card.heads.map((h, i) => (
              <th key={i}>
                <div className="th">
                  <input value={h} aria-label={`Nombre de la columna ${i + 1}`} onChange={(e) => dispatch({ t: 'tableHead', card: card.id, col: i, value: e.target.value })} />
                  {card.heads.length > 1 && <button className="x" aria-label="Eliminar columna" title="Eliminar columna" onClick={() => dispatch({ t: 'tableRemoveCol', card: card.id, col: i })}>×</button>}
                </div>
              </th>
            ))}
            <th className="tbl-add"><button aria-label="Añadir columna" title="Añadir columna" onClick={() => dispatch({ t: 'tableAddCol', card: card.id })}>+</button></th>
          </tr>
        </thead>
        <tbody>
          {card.rows.map((r, ri) => (
            <tr key={r.id}>
              {r.cells.map((v, ci) => (
                <td key={ci}>
                  <input id={`cell-${r.id}-${ci}`} value={v} aria-label={`Fila ${ri + 1}, ${card.heads[ci]}`}
                    onChange={(e) => dispatch({ t: 'tableCell', card: card.id, row: r.id, col: ci, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = card.rows[ri + 1];
                        if (next) focusCell(next.id, ci);
                        else { const id = uid('row'); dispatch({ t: 'tableAddRow', card: card.id, id }); focusCell(id, ci); }
                      }
                    }} />
                </td>
              ))}
              <td className="tbl-add">{card.rows.length > 1 && <button className="x" aria-label="Eliminar fila" title="Eliminar fila" onClick={() => dispatch({ t: 'tableRemoveRow', card: card.id, row: r.id })}>×</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="link small" onClick={() => { const id = uid('row'); dispatch({ t: 'tableAddRow', card: card.id, id }); focusCell(id, 0); }}>+ Nueva fila</button>
    </div>
  );
}
