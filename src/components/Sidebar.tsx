import { useEffect, useState } from 'react';
import { useApp } from '../App';
import { formatTimer, rowTitle, runningTimer } from '../lib/pm';
import { PROJECT_COLORS, uid } from '../lib/model';
import type { Project } from '../lib/model';
import { groupReminders, projectStats, reminders } from '../lib/agenda';
import { todayKey } from '../lib/store';
import { DEFAULT_SESSION_FONT, fontCss, normalizeFont, normalizeSide, sideVars } from '../lib/appearance';
import { FontPanel, SidePanel } from './Appearance';

export function Sidebar() {
  const { state, dispatch, status, lock, openSettings, openSearch } = useApp();
  const [adding, setAdding] = useState<{ folder: string | null } | null>(null);
  const [name, setName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [moveMenu, setMoveMenu] = useState<string | null>(null);
  const [renamingSession, setRenamingSession] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const sessionFont = normalizeFont(state.settings.sessionFont, DEFAULT_SESSION_FONT);
  const side = normalizeSide(state.settings.side);

  const create = () => {
    const target = adding;
    setAdding(null);
    if (!target || !name.trim()) { setName(''); return; }
    const color = PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length];
    dispatch({ t: 'addProject', id: uid('proj'), name, color, folder: target.folder });
    setName('');
  };
  const createFolder = () => {
    setAddingFolder(false);
    if (folderName.trim()) dispatch({ t: 'addFolder', id: uid('folder'), name: folderName });
    setFolderName('');
  };
  const live = state.projects.filter((p) => !p.trashed && !p.hidden && !p.home);

  const newProject = () => (
    <input className="side-input" autoFocus value={name} placeholder="Nombre de la tarea principal" aria-label="Nombre de la tarea principal"
      onChange={(e) => setName(e.target.value)} onBlur={create}
      onKeyDown={(e) => { if (e.key === 'Enter') create(); if (e.key === 'Escape') { setName(''); setAdding(null); } }} />
  );

  const projectRow = (p: Project) => {
    const st = projectStats(state.cards, p.id);
    return (
      <div key={p.id} className={'proj-row' + (p.id === state.sel && state.view === 'board' ? ' on' : '')}>
        <button className={'side-item proj' + (p.id === state.sel && state.view === 'board' ? ' on' : '')} onClick={() => dispatch({ t: 'select', id: p.id })}>
          <span className="dot" style={{ background: p.color }} />
          <span className="side-name">{p.name}</span>
          {st.total > 0 && <span className="side-count" title={`${st.done} de ${st.total} hechas`}>{st.done}/{st.total}</span>}
        </button>
        <span className="row-actions">
          <span className="menu-anchor">
            <button className="icon-btn small" title="Mover a una carpeta" aria-label="Mover a una carpeta" aria-expanded={moveMenu === p.id} onClick={() => setMoveMenu(moveMenu === p.id ? null : p.id)}>⇢</button>
            {moveMenu === p.id && (
              <div className="menu move-menu" role="menu" aria-label="Mover a" onMouseLeave={() => setMoveMenu(null)}>
                <span className="menu-label">Mover a</span>
                {state.folders.map((f) => <button key={f.id} role="menuitem" className={p.folder === f.id ? 'on' : ''} onClick={() => { dispatch({ t: 'patchProject', id: p.id, patch: { folder: f.id } }); setMoveMenu(null); }}>{f.name}</button>)}
                <button role="menuitem" className={!p.folder ? 'on' : ''} onClick={() => { dispatch({ t: 'patchProject', id: p.id, patch: { folder: null } }); setMoveMenu(null); }}>Sin carpeta</button>
              </div>
            )}
          </span>
          <button className="icon-btn small" title="Mover a la papelera" aria-label="Mover a la papelera" onClick={() => dispatch({ t: 'trashProject', id: p.id })}>🗑</button>
        </span>
        {st.total > 0 && <div className="side-bar" aria-hidden="true"><span style={{ width: st.pct + '%', background: p.color }} /></div>}
      </div>
    );
  };

  const todayCount = groupReminders(reminders(state)).filter((g) => g.key === 'late' || g.key === 'today').reduce((m, g) => m + g.items.length, 0);
  const dailyCount = state.cards.filter((c) => c.type === 'note' && c.day && !c.trashed).length;
  const trashCount = state.projects.filter((p) => p.trashed).length + state.cards.filter((c) => c.trashed).length;

  return (
    <aside className={'side tex-' + side.texture} style={sideVars(side)}>
      <div className="brand-row">
        {renamingSession ? (
          <input className="brand brand-input" aria-label="Nombre de la sesión" autoFocus defaultValue={state.settings.sessionName} style={fontCss(sessionFont, 'session')}
            onBlur={(e) => { dispatch({ t: 'settings', patch: { sessionName: e.target.value.trim() || 'Cuaderno' } }); setRenamingSession(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur(); }} />
        ) : (
          <button className="brand side-name-btn" style={fontCss(sessionFont, 'session')} title="Haz clic para cambiar el nombre de la sesión" onClick={() => setRenamingSession(true)}>{state.settings.sessionName || 'Cuaderno'}</button>
        )}
        <button className="icon-btn small" title="Fuente del nombre" aria-label="Fuente del nombre" onClick={() => setFontOpen(true)}>Aa</button>
      </div>
      {fontOpen && <FontPanel kind="session" font={sessionFont} onChange={(f) => dispatch({ t: 'settings', patch: { sessionFont: f } })} onClose={() => setFontOpen(false)} />}
      {sideOpen && <SidePanel onClose={() => setSideOpen(false)} />}
      <div className="side-tools">
        <button className="side-search" onClick={openSearch}><span>Buscar</span><kbd>⌘K</kbd></button>
      </div>

      <nav aria-label="Vistas" className="side-views">
        <button className={'side-item' + (state.view === 'board' && state.sel === 'home' ? ' on' : '')} onClick={() => dispatch({ t: 'select', id: 'home' })}><span className="vi">⌂</span><span className="side-name">Inicio</span></button>
        <button className={'side-item' + (state.view === 'today' ? ' on' : '')} onClick={() => dispatch({ t: 'view', view: 'today' })}><span className="vi">☀</span><span className="side-name">Hoy</span><span className="side-count">{todayCount || ''}</span></button>
        <button className={'side-item' + (state.view === 'reminders' ? ' on' : '')} onClick={() => dispatch({ t: 'view', view: 'reminders' })}><span className="vi">🔔</span><span className="side-name">Recordatorios</span></button>
        <button className={'side-item' + (state.view === 'calendar' ? ' on' : '')} onClick={() => dispatch({ t: 'view', view: 'calendar' })}><span className="vi">▦</span><span className="side-name">Calendario</span></button>
        <button className={'side-item' + (state.view === 'graph' ? ' on' : '')} onClick={() => dispatch({ t: 'view', view: 'graph' })}><span className="vi">◎</span><span className="side-name">Grafo</span></button>
        <button className={'side-item' + (state.view === 'journal' ? ' on' : '')} onClick={() => dispatch({ t: 'day', day: todayKey() })}><span className="vi">✎</span><span className="side-name">Diario</span><span className="side-count">{dailyCount || ''}</span></button>
        <button className={'side-item' + (state.view === 'trash' ? ' on' : '')} onClick={() => dispatch({ t: 'view', view: 'trash' })}><span className="vi">🗑</span><span className="side-name">Papelera</span><span className="side-count">{trashCount || ''}</span></button>
      </nav>
      <div className="side-label">Tareas principales</div>
      <nav aria-label="Tareas principales" className="side-list">
        {state.folders.map((f) => {
          const inside = live.filter((p) => p.folder === f.id);
          return (
            <div key={f.id} className="side-folder">
              <div className="folder-head">
                <button className="icon-btn small" aria-expanded={!f.collapsed} aria-label={f.collapsed ? 'Desplegar carpeta' : 'Plegar carpeta'} onClick={() => dispatch({ t: 'patchFolder', id: f.id, patch: { collapsed: !f.collapsed } })}>{f.collapsed ? '▸' : '▾'}</button>
                {renamingFolder === f.id ? (
                  <input className="side-input folder-input" aria-label="Nombre de la carpeta" autoFocus defaultValue={f.name}
                    onBlur={(e) => { dispatch({ t: 'patchFolder', id: f.id, patch: { name: e.target.value } }); setRenamingFolder(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur(); }} />
                ) : (
                  <button className="folder-name" title="Haz clic para cambiar el nombre" onClick={() => setRenamingFolder(f.id)}>{f.name}</button>
                )}
                <span className="row-actions">
                  <button className="icon-btn small" title="Nueva tarea principal aquí" aria-label="Nueva tarea principal aquí" onClick={() => { setAdding({ folder: f.id }); if (f.collapsed) dispatch({ t: 'patchFolder', id: f.id, patch: { collapsed: false } }); }}>+</button>
                  <button className="icon-btn small" title="Eliminar carpeta (las tareas se conservan)" aria-label="Eliminar carpeta (las tareas se conservan)" onClick={() => dispatch({ t: 'deleteFolder', id: f.id })}>×</button>
                </span>
              </div>
              {!f.collapsed && (
                <div className="folder-body">
                  {inside.map((p) => projectRow(p))}
                  {adding && adding.folder === f.id && newProject()}
                  {!inside.length && !(adding && adding.folder === f.id) && <p className="side-empty">Carpeta vacía</p>}
                </div>
              )}
            </div>
          );
        })}
        {live.filter((p) => !p.folder || !state.folders.some((f) => f.id === p.folder)).map((p) => projectRow(p))}
      </nav>

      {adding && adding.folder === null && newProject()}
      {addingFolder && (
        <input className="side-input" autoFocus value={folderName} placeholder="Nombre de la carpeta" aria-label="Nombre de la carpeta"
          onChange={(e) => setFolderName(e.target.value)}
          onBlur={createFolder}
          onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setFolderName(''); setAddingFolder(false); } }} />
      )}
      <div className="side-adds">
        <button className="side-add" onClick={() => setAdding({ folder: null })}>+ Tarea principal</button>
        <button className="side-add" onClick={() => setAddingFolder(true)}>Carpeta</button>
      </div>

      <TimerBadge />
      <BackupBadge />
      <div className="side-foot">
        {status.encrypted && (
          <button className="icon-btn" title="Bloquear ahora" aria-label="Bloquear ahora" onClick={() => void lock()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          </button>
        )}
        <button className="icon-btn small" title="Personalizar barra" aria-label="Personalizar barra" onClick={() => setSideOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A3.7 3.7 0 0 0 21 8.6C21 5.4 17 3 12 3Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7" r="1" /></svg>
        </button>
        <button className="side-settings" onClick={() => openSettings('general')}>Ajustes</button>
      </div>
      <div className="side-local" title="Todo se guarda solo en este dispositivo">Local</div>
    </aside>
  );
}

/** Cronómetro en marcha (en cualquier Tabla PM), con el tiempo en directo. Clic: abre la tabla. */
function TimerBadge() {
  const { state, dispatch, openPm } = useApp();
  const [, tick] = useState(0);
  let found: { card: string; title: string; row: string; col: string; start: number; ms: number } | null = null;
  for (const c of state.cards) {
    if (c.type !== 'pm' || c.trashed) continue;
    const t = runningTimer(c.pm);
    if (t) { found = { card: c.id, title: rowTitle(c.pm, t.row, state.tags), row: t.row.id, col: t.col.id, start: t.start, ms: t.ms }; break; }
  }
  const running = !!found;
  useEffect(() => {
    if (!running) return;
    const h = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(h);
  }, [running]);
  if (!found) return null;
  const f = found;
  return (
    <div className="timer-badge">
      <button className="timer-go" onClick={() => openPm(f.card)} title="Ir a la tarea" aria-label="Ir a la tarea">
        <span className="rec" /> <b>{formatTimer(f.ms + Date.now() - f.start)}</b> <span className="ellipsis">{f.title}</span>
      </button>
      <button className="timer-stop" onClick={() => dispatch({ t: 'pm', card: f.card, op: { op: 'timer', row: f.row, col: f.col, action: 'stop', now: Date.now() } })}>Detener</button>
    </div>
  );
}

/** Indicador de copias: solo aparece si hay alguna activa; abre Ajustes → Backup. */
function BackupBadge() {
  const { state, openSettings } = useApp();
  const bk = state.settings.backup;
  if (!bk.auto.on && !bk.internal.on) return null;
  const every = { h4: '4 h', h8: '8 h', h12: '12 h', day: 'día', week: 'semana' }[bk.auto.every];
  const im = bk.internal.everyMin;
  const parts = [bk.auto.on && `Automático cada ${every}`, bk.internal.on && `interno cada ${im < 60 ? im + ' min' : im / 60 + ' h'}`].filter(Boolean).join(' · ');
  return (
    <button className="side-backup" onClick={() => openSettings('backup')} title="Ajustes de backup">
      <b>Backup activo</b><br />{parts}
    </button>
  );
}
