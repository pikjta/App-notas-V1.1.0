import { useApp } from '../../App';
import type { PmCard } from '../../lib/model';
import { cellText, COLORS, progress, stateInfo, tableProgress } from '../../lib/pm';

/** Vista compacta de una Tabla PM en el tablero: progreso y primeras filas. */
export function PmBody({ card }: { card: PmCard }) {
  const { state, openPm } = useApp();
  const pm = card.pm;
  const pct = tableProgress(pm);
  // Las 3 primeras columnas visibles, en el orden de la tabla.
  const shown = pm.cols.filter((c) => !c.hidden).slice(0, 3);
  return (
    <div className="pm-compact">
      {pct !== null && (
        <div className="progress-row">
          <div className="progress"><span style={{ width: pct + '%' }} /></div>
          <span className="small muted">{pct}%</span>
        </div>
      )}
      <div className="small muted">{pm.rows.length} {pm.rows.length === 1 ? 'tarea' : 'tareas'}</div>
      {pm.rows.slice(0, 6).map((r) => (
        <div key={r.id} className="pm-mini-row">
          {shown.map((c, k) => {
            if (c.type === 'status') {
              const si = stateInfo(c, r.cells[c.id]);
              if (!si) return <span key={c.id} className="pm-mini-cell muted">—</span>;
              const [bg, fg] = COLORS[si.ph.color] ?? COLORS.gray;
              return <span key={c.id} className="pm-mini-cell"><span className="pill" style={{ background: bg, color: fg }}>{si.st.name}</span></span>;
            }
            if (c.type === 'progress') return <span key={c.id} className="pm-mini-cell"><span className="progress mini"><span style={{ width: progress(pm, c, r) + '%' }} /></span></span>;
            const txt = cellText(pm, c, r, state.tags);
            return <span key={c.id} className={'pm-mini-cell ellipsis' + (k === 0 ? ' first' : '')}>{txt || (k === 0 ? 'Sin título' : '—')}</span>;
          })}
        </div>
      ))}
      {pm.rows.length > 6 && <div className="small muted">+{pm.rows.length - 6} más</div>}
      <button className="tool small-btn" onClick={() => openPm(card.id)}>Abrir tabla</button>
    </div>
  );
}
