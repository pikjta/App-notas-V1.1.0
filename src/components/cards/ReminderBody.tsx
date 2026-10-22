import { useState } from 'react';
import { formatClock } from '../../lib/notify';
import { useApp } from '../../App';
import type { ReminderCard } from '../../lib/model';

const DAY = 86_400_000;

/** «hoy a las 10:30», «mañana», «en 3 días», «hace 2 días»… */
export function relativeWhen(iso: string | null, now = new Date()): { text: string; late: boolean } {
  if (!iso) return { text: 'Sin fecha', late: false };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { text: 'Sin fecha', late: false };
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(d) - startOf(now)) / DAY);
  const hm = formatClock(d);
  const late = d.getTime() < now.getTime();
  if (days === 0) return { text: (late ? 'Hoy, ya pasó · ' : 'Hoy a las ') + hm, late };
  if (days === 1) return { text: 'Mañana a las ' + hm, late: false };
  if (days === -1) return { text: 'Ayer a las ' + hm, late: true };
  if (days > 1) return { text: `En ${days} días · ` + d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }), late: false };
  return { text: `Hace ${-days} días · ` + d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }), late: true };
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const pad = (n: number) => String(n).padStart(2, '0');

export function ReminderBody({ card }: { card: ReminderCard }) {
  const { dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const rel = relativeWhen(card.when);
  const when = card.when ? new Date(card.when) : null;
  const valid = when && !isNaN(when.getTime()) ? when : null;
  const setWhen = (d: Date) => dispatch({ t: 'patchCard', id: card.id, patch: { when: d.toISOString() } });
  return (
    <div className="reminder">
      <button className={'rem-big' + (rel.late ? ' late' : '')} aria-label="Cambiar fecha y hora" onClick={() => setOpen((o) => !o)}>
        <span className="rem-month">{valid ? MONTHS[valid.getMonth()] : '—'}</span>
        <span className="rem-day">{valid ? valid.getDate() : '—'}</span>
      </button>
      <div className={'rem-when' + (rel.late ? ' late' : '')}>{rel.text}</div>
      {valid && <div className="small muted">{valid.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {formatClock(valid)}</div>}
      <div className="row wrap">
        <button className={'chip' + (card.bell ? ' on' : '')} aria-pressed={card.bell} title={card.bell ? 'Silenciar el aviso' : 'Activar el aviso'}
          onClick={() => dispatch({ t: 'patchCard', id: card.id, patch: { bell: !card.bell } })}>{card.bell ? '🔔 Aviso' : '🔕 Sin aviso'}</button>
        <button className="chip" onClick={() => setOpen((o) => !o)}>{valid ? 'Cambiar' : 'Elegir fecha'}</button>
      </div>
      {open && <DatePicker value={valid} onChange={setWhen} onClose={() => setOpen(false)} />}
      <textarea className="rem-note" rows={2} value={card.note} placeholder="Detalles (opcional)" aria-label="Detalles"
        onChange={(e) => dispatch({ t: 'patchCard', id: card.id, patch: { note: e.target.value } })} />
    </div>
  );
}

/** Selector: atajos, calendario mensual, hora y minutos. */
function DatePicker({ value, onChange, onClose }: { value: Date | null; onChange: (d: Date) => void; onClose: () => void }) {
  const base = value ?? (() => { const d = new Date(Date.now() + 3_600_000); d.setMinutes(0, 0, 0); return d; })();
  const [view, setView] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const cur = value ?? base;
  const put = (d: Date) => onChange(d);
  const day = (offset: number) => { const d = new Date(cur); const t = new Date(); t.setDate(t.getDate() + offset); d.setFullYear(t.getFullYear(), t.getMonth(), t.getDate()); put(d); setView(new Date(d.getFullYear(), d.getMonth(), 1)); };
  const first = (view.getDay() + 6) % 7; // semana desde el lunes
  const n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(0), ...Array.from({ length: n }, (_, i) => i + 1)];
  return (
    <div className="date-pick" role="dialog" aria-label="Elegir fecha y hora">
      <div className="row wrap">
        <button className="chip" onClick={() => day(0)}>Hoy</button>
        <button className="chip" onClick={() => day(1)}>Mañana</button>
        <button className="chip" onClick={() => day(7)}>En una semana</button>
      </div>
      <div className="row">
        <button className="icon-btn small" aria-label="Mes anterior" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>‹</button>
        <b className="grow center">{view.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</b>
        <button className="icon-btn small" aria-label="Mes siguiente" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="dp-grid">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <span key={d} className="small muted">{d}</span>)}
        {cells.map((d, i) => d === 0 ? <span key={i} /> : (
          <button key={i} className={'dp-day' + (value && value.getFullYear() === view.getFullYear() && value.getMonth() === view.getMonth() && value.getDate() === d ? ' on' : '')}
            onClick={() => { const x = new Date(cur); x.setFullYear(view.getFullYear(), view.getMonth(), d); put(x); }}>{d}</button>
        ))}
      </div>
      <div className="row">
        <label className="small">Hora
          <select value={cur.getHours()} aria-label="Hora" onChange={(e) => { const x = new Date(cur); x.setHours(Number(e.target.value)); put(x); }}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{pad(h)}</option>)}
          </select>
        </label>
        <label className="small">Minutos
          <select value={Math.floor(cur.getMinutes() / 5) * 5} aria-label="Minutos" onChange={(e) => { const x = new Date(cur); x.setMinutes(Number(e.target.value)); put(x); }}>
            {Array.from({ length: 12 }, (_, m) => <option key={m} value={m * 5}>{pad(m * 5)}</option>)}
          </select>
        </label>
        <span className="grow" />
        <button className="primary small-btn" onClick={onClose}>Listo</button>
      </div>
    </div>
  );
}
