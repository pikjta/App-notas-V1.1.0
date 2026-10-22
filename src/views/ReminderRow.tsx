import { useApp } from '../App';
import type { ReminderItem } from '../lib/agenda';
import { whenLabel } from '../lib/agenda';

export function ReminderRow({ it, late }: { it: ReminderItem; late?: boolean }) {
  const { dispatch, goTo } = useApp();
  const c = it.card;
  return (
    <div className="rem-row">
      <span className="dot" style={{ background: it.project.color }} />
      <div className="rem-main">
        <span className="rem-title">{c.title || c.note || 'Recordatorio sin título'}</span>
        <span className="small muted">{it.project.name}{c.title && c.note ? ' · ' + c.note : ''}</span>
      </div>
      <span className={'rem-at' + (late ? ' late' : '')}>{whenLabel(it.at)}</span>
      <button className="bell" title="Activar o silenciar aviso" aria-label="Activar o silenciar aviso" aria-pressed={c.bell}
        onClick={() => dispatch({ t: 'patchCard', id: c.id, patch: { bell: !c.bell } })}>{c.bell ? '🔔' : '🔕'}</button>
      <button className="tool small-btn" onClick={() => goTo(it.project.id, c.id)}>Abrir</button>
    </div>
  );
}
