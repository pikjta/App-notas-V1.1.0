import { useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../../App';
import { buildGraph, neighbours, nid } from '../../lib/graph';
import { MarkdownField } from '../../components/MarkdownField';
import { blockers, blocking, COLORS, formatDuration, isDone, phaseDurations, pmId, rowTitle, stateInfo, TYPE_ICON, wouldCycle } from '../../lib/pm';
import type { Col, Opt, Pm, PmOp, Row } from '../../lib/pm';

/**
 * Página de una fila (panel lateral): propiedades, descripción en Markdown, subtareas,
 * dependencias e historial de estados con el tiempo pasado en cada fase.
 */
export function RowPage({ pm, row, tags, op, cell, onClose, onOpenRow, cardId }: {
  cardId?: string; pm: Pm; row: Row; tags: Opt[]; op: (o: PmOp) => void;
  cell: (col: Col) => ReactNode; onClose: () => void; onOpenRow: (id: string) => void;
}) {
  const { state, toast, copy } = useApp();
  const [newSub, setNewSub] = useState('');
  const [depPick, setDepPick] = useState(false);
  const titleCol = pm.cols.find((c) => c.type === 'text');
  const status = pm.cols.find((c) => c.type === 'status');
  const subs = row.subs ?? [];
  const done = subs.filter((s) => s.done).length;
  const patch = (p: Partial<Omit<Row, 'id' | 'cells'>>) => op({ op: 'row', id: row.id, patch: p });
  const blockedBy = blockers(pm, row);
  const waiting = blocking(pm, row);
  const durations = status ? phaseDurations(status, row) : [];
  const totalMs = durations.reduce((m, d) => m + d.ms, 0);
  const candidates = pm.rows.filter((r) => r.id !== row.id && !(row.deps ?? []).includes(r.id) && !wouldCycle(pm, row.id, r.id));

  const title = rowTitle(pm, row, tags);
  const markdown = () => {
    const lines = ['# ' + (title || 'Sin título'), ''];
    for (const c of pm.cols) if (c.id !== titleCol?.id) { const v = row.cells[c.id]; if (v !== undefined && v !== null && v !== '' && typeof v !== 'object') lines.push(`- **${c.name}:** ${String(v)}`); }
    if (row.desc?.trim()) lines.push('', row.desc.trim());
    if (subs.length) lines.push('', ...subs.map((x) => `- [${x.done ? 'x' : ' '}] ${x.text}`));
    return lines.join('\n') + '\n';
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown()], { type: 'text/markdown' }));
    const a = document.createElement('a'); a.href = url; a.download = (title || 'tarea').replace(/[\\/:*?"<>|]/g, '-') + '.md'; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Descargado como .md');
  };
  const linkedFrom = (() => {
    if (!cardId) return [];
    const g = buildGraph(state);
    const me = nid.row(cardId, row.id);
    return neighbours(g, me).filter((n) => (n.kind === 'link' || n.kind === 'rel') && !n.out).map((n) => n.node.label);
  })();

  return (
    <aside className="row-page" role="complementary" aria-label={'Página de ' + rowTitle(pm, row, tags)}>
      <div className="row">
        <span className="menu-label grow">{row.archived ? 'Tarea archivada' : 'Página de la tarea'}</span>
        <button className="tool small-btn" onClick={() => copy(`[[${state.projects.find((p) => p.id === state.cards.find((c) => c.id === cardId)?.project)?.name ?? ''}/${state.cards.find((c) => c.id === cardId)?.title ?? ''}]]`, 'Enlace copiado')}>[[ ]] Enlace</button>
        <button className="tool small-btn" aria-label="Descargar como .md" title="Descargar como .md (compatible con Obsidian)" onClick={download}>⤓ .md</button>
        <button className="tool small-btn" onClick={() => copy(markdown(), 'Markdown copiado')}>Copiar</button>
        <button className="icon-btn small" aria-label="Cerrar página" onClick={onClose}>✕</button>
      </div>
      {titleCol && (
        <input className="row-page-title" value={(row.cells[titleCol.id] as string) ?? ''} placeholder="Sin título" aria-label="Título de la fila"
          onChange={(e) => op({ op: 'cell', row: row.id, col: titleCol.id, value: e.target.value })} />
      )}
      {blockedBy.length > 0 && <div className="blocked-note">Bloqueada por {blockedBy.map((r) => '«' + rowTitle(pm, r, tags) + '»').join(', ')}</div>}

      <section className="props">
        {pm.cols.filter((c) => c.id !== titleCol?.id).map((c) => (
          <div key={c.id} className="prop">
            <span className="prop-name"><span className="th-icon">{TYPE_ICON[c.type]}</span>{c.name}</span>
            <div className="prop-val">{cell(c)}</div>
          </div>
        ))}
      </section>

      <section>
        <h4>Descripción</h4>
        <MarkdownField value={row.desc ?? ''} onChange={(desc) => patch({ desc })} label="Descripción de la fila" slash placeholder="Notas, enlaces [[ ]], tareas…" />
      </section>

      <section>
        <h4>Subtareas {subs.length > 0 && <span className="small muted">{done}/{subs.length}</span>}</h4>
        {subs.length > 0 && <div className="progress"><span style={{ width: `${Math.round((done / subs.length) * 100)}%` }} /></div>}
        {subs.map((s) => (
          <div key={s.id} className="check-row">
            <input type="checkbox" checked={s.done} aria-label="Subtarea hecha" onChange={() => patch({ subs: subs.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })} />
            <input className={'check-text' + (s.done ? ' done' : '')} value={s.text} aria-label="Subtarea" onChange={(e) => patch({ subs: subs.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)) })} />
            <button className="icon-btn small" aria-label="Quitar subtarea" onClick={() => patch({ subs: subs.filter((x) => x.id !== s.id) })}>×</button>
          </div>
        ))}
        <input className="add-sub" value={newSub} placeholder="+ Añadir subtarea (Enter)" aria-label="Nueva subtarea" onChange={(e) => setNewSub(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newSub.trim()) { patch({ subs: [...subs, { id: pmId('sub'), text: newSub.trim(), done: false }] }); setNewSub(''); } }} />
      </section>

      <section>
        <h4>Planificación</h4>
        <label className="check-line small"><input type="checkbox" checked={!!row.milestone} onChange={() => patch({ milestone: !row.milestone })} /> ◆ Hito</label>
        <label className="prop"><span className="prop-name">↻ Repetir</span>
          <select aria-label="Repetir" value={row.recur ?? ''} onChange={(e) => patch({ recur: (e.target.value || null) as Row['recur'] })}>
            <option value="">Nunca</option><option value="week">Semana</option><option value="month">Mes</option><option value="year">Año</option>
          </select>
        </label>
        <span className="small muted">⛓ Bloqueada por</span>
        {(row.deps ?? []).map((id) => {
          const r = pm.rows.find((x) => x.id === id);
          if (!r) return null;
          return (
            <div key={id} className="dep">
              <span className={'dep-dot' + (isDone(pm, r) ? ' ok' : '')} />
              <button className="link" onClick={() => onOpenRow(id)}>{rowTitle(pm, r, tags)}</button>
              <span className="grow small muted">{isDone(pm, r) ? 'terminada' : 'pendiente'}</span>
              <button className="icon-btn small" aria-label="Quitar dependencia" onClick={() => patch({ deps: (row.deps ?? []).filter((d) => d !== id) })}>×</button>
            </div>
          );
        })}
        {depPick ? (
          <select autoFocus aria-label="Añadir dependencia" defaultValue="" onBlur={() => setDepPick(false)} onChange={(e) => { if (e.target.value) patch({ deps: [...(row.deps ?? []), e.target.value] }); setDepPick(false); }}>
            <option value="">Elige la fila que tiene que terminar antes…</option>
            {candidates.map((r) => <option key={r.id} value={r.id}>{rowTitle(pm, r, tags)}</option>)}
          </select>
        ) : (
          <button className="link small" disabled={!candidates.length} onClick={() => setDepPick(true)}>+ Añadir dependencia</button>
        )}
        {waiting.length > 0 && (
          <>
            <span className="small muted">Bloquea a</span>
            {waiting.map((r) => <div key={r.id} className="dep"><span className="dep-dot wait" /><button className="link" onClick={() => onOpenRow(r.id)}>{rowTitle(pm, r, tags)}</button></div>)}
          </>
        )}
      </section>

      {status && (
        <section>
          <h4>Historial de estados</h4>
          {durations.length > 0 && (
            <div className="phase-bar" aria-label="Tiempo por fase">
              {durations.map((d) => <span key={d.phase.id} title={`${d.phase.name}: ${formatDuration(d.ms)}`} style={{ flex: Math.max(d.ms / totalMs, 0.04), background: COLORS[d.phase.color]?.[1] }} />)}
            </div>
          )}
          {durations.map((d) => <div key={d.phase.id} className="small row"><span className="dot" style={{ background: COLORS[d.phase.color]?.[1] }} /><span className="grow">{d.phase.name}</span><b>{formatDuration(d.ms)}</b></div>)}
          <ol className="hist">
            {(row.hist ?? []).slice().reverse().map((h, i) => {
              const si = stateInfo(status, h.state);
              return <li key={i}><span className="small muted">{new Date(h.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> {si ? <span className="pill" style={{ background: COLORS[si.ph.color]?.[0], color: COLORS[si.ph.color]?.[1] }}>{si.st.name}</span> : <span className="muted">sin estado</span>}</li>;
            })}
            {!(row.hist ?? []).length && <li className="muted small">Aún no ha cambiado de estado.</li>}
          </ol>
        </section>
      )}

      <section>
        <h4>Enlazado desde</h4>
        {linkedFrom.length ? linkedFrom.map((l, i) => <div key={i} className="small">{l}</div>) : <span className="small muted">Ninguna nota enlaza esta tarea.</span>}
      </section>

      <div className="row">
        <button className="tool" onClick={() => patch({ archived: !row.archived })}>{row.archived ? 'Desarchivar' : 'Archivar'}</button>
      </div>
    </aside>
  );
}
