import { useState } from 'react';
import { useApp } from '../App';
import { CARD_KIND_LABEL } from '../lib/model';
import type { Project } from '../lib/model';

const ago = (t: number) => {
  const d = Math.floor((Date.now() - t) / 86_400_000);
  return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`;
};

/** Papelera general: tareas principales y tarjetas eliminadas de cualquier tablero. */
export function Trash() {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState<string | null>(null);
  const projects = state.projects.filter((p) => p.trashed);
  const trashedIds = new Set(projects.map((p) => p.id));
  const cards = state.cards.filter((c) => c.trashed && !trashedIds.has(c.project));
  const name = (id: string) => state.projects.find((p) => p.id === id)?.name ?? '';
  const empty = projects.length + cards.length === 0;
  const folderName = (p: Project) => state.folders.find((f) => f.id === p.folder)?.name;

  return (
    <main className="board trash-view">
      <header className="board-head">
        <div className="grow">
          <h1 className="board-title">Papelera</h1>
          <p className="muted">Lo que eliminas se guarda aquí hasta que lo borres definitivamente</p>
        </div>
        {!empty && (confirm === 'all' ? (
          <span className="confirm">¿Seguro?<button className="tool" onClick={() => setConfirm(null)}>No</button><button className="danger" onClick={() => { dispatch({ t: 'emptyTrash' }); setConfirm(null); }}>Vaciar todo</button></span>
        ) : (
          <button className="tool" onClick={() => setConfirm('all')}>Vaciar papelera</button>
        ))}
      </header>
      <section className="trash-section">
        <h2>Tareas principales · {projects.length}</h2>
        {projects.length === 0 ? <p className="muted">No hay tareas principales en la papelera.</p> : (
          <div className="trash-list">
            {projects.map((p) => (
              <div key={p.id} className="trash-row">
                <span className="dot" style={{ background: p.color }} />
                <div className="grow"><b>{p.name}</b><div className="small muted">{state.cards.filter((c) => c.project === p.id).length} tarjetas{folderName(p) ? ' · ' + folderName(p) : ''} · {ago(p.trashed!)}</div></div>
                <button className="tool" onClick={() => dispatch({ t: 'restoreProject', id: p.id })}>Restaurar</button>
                {confirm === p.id ? <button className="danger" onClick={() => { dispatch({ t: 'purgeProject', id: p.id }); setConfirm(null); }}>Borrar para siempre</button> : <button className="tool subtle" aria-label="Eliminar definitivamente" title="Eliminar definitivamente" onClick={() => setConfirm(p.id)}>Eliminar definitivamente</button>}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="trash-section">
        <h2>Tarjetas de todos los tableros · {cards.length}</h2>
        {cards.length === 0 ? <p className="muted">No hay tarjetas en la papelera.</p> : (
          <div className="trash-list">
            {cards.map((c) => (
              <div key={c.id} className="trash-row">
                <span className="dot" style={{ background: state.projects.find((p) => p.id === c.project)?.color }} />
                <div className="grow"><b>{c.title || CARD_KIND_LABEL[c.type]}</b><div className="small muted">{CARD_KIND_LABEL[c.type]} · {name(c.project)} · {ago(c.trashed!)}</div></div>
                <button className="tool" onClick={() => dispatch({ t: 'restoreCard', id: c.id })}>Restaurar</button>
                {confirm === c.id ? <button className="danger" onClick={() => { dispatch({ t: 'purgeCard', id: c.id }); setConfirm(null); }}>Borrar para siempre</button> : <button className="tool subtle" aria-label="Eliminar definitivamente" title="Eliminar definitivamente" onClick={() => setConfirm(c.id)}>Eliminar definitivamente</button>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/** Papelera de un tablero: sus tarjetas eliminadas. */
export function BoardTrash({ project, onClose }: { project: Project; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState<string | null>(null);
  const cards = state.cards.filter((c) => c.project === project.id && c.trashed);
  return (
    <div className="ap-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="ap-panel" role="dialog" aria-label={`Papelera de «${project.name}»`} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <header className="ap-head"><h2>Papelera de «{project.name}»</h2></header>
        <div className="ap-body">
          {cards.length === 0 ? <p className="muted">No hay tarjetas eliminadas en este tablero.</p> : cards.map((c) => (
            <div key={c.id} className="trash-row">
              <div className="grow"><b>{c.title || CARD_KIND_LABEL[c.type]}</b><div className="small muted">{CARD_KIND_LABEL[c.type]} · {ago(c.trashed!)}</div></div>
              <button className="tool" onClick={() => dispatch({ t: 'restoreCard', id: c.id })}>Restaurar</button>
              {confirm === c.id ? <button className="danger" onClick={() => { dispatch({ t: 'purgeCard', id: c.id }); setConfirm(null); }}>Borrar para siempre</button> : <button className="tool subtle" aria-label="Eliminar definitivamente" title="Eliminar definitivamente" onClick={() => setConfirm(c.id)}>Eliminar definitivamente</button>}
            </div>
          ))}
        </div>
        <footer className="ap-foot">
          {cards.length > 0 && (confirm === 'all' ? <span className="confirm">¿Seguro?<button className="tool" onClick={() => setConfirm(null)}>No</button><button className="danger" onClick={() => { dispatch({ t: 'emptyBoardTrash', project: project.id }); setConfirm(null); }}>Vaciar todo</button></span> : <button className="tool" onClick={() => setConfirm('all')}>Vaciar papelera</button>)}
          <span className="grow" /><button className="primary" onClick={onClose}>Cerrar</button>
        </footer>
      </section>
    </div>
  );
}
