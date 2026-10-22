import { useApp } from '../App';
import { longDate, shiftDay } from '../lib/agenda';
import type { NoteCard } from '../lib/model';
import { dailyId, JOURNAL_TEMPLATE, todayKey } from '../lib/store';
import { CardFrame } from '../components/Board';
import { hm, itemsBetween } from '../lib/calendar';

const WD = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function Journal() {
  const { state, dispatch, requestEdit } = useApp();
  const day = state.day;
  const tk = todayKey();
  const entries = state.cards.filter((c): c is NoteCard => c.type === 'note' && !!c.day && !c.trashed).sort((a, b) => (a.day! < b.day! ? 1 : -1));
  const has = new Set(entries.map((e) => e.day));
  const dayItems = itemsBetween(state, day, day);
  const card = entries.find((e) => e.id === dailyId(day));
  const [y, m] = day.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((offset + new Date(y, m, 0).getDate()) / 7) * 7 }, (_, i) => new Date(y, m - 1, 1 - offset + i));
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const firstLine = (b: string) => b.split('\n').map((l) => l.replace(/^#+\s*|^[-*]\s*(\[[ xX]\]\s*)?|^>\s*/g, '').trim()).find(Boolean) ?? '(vacía)';

  return (
    <main className="board view">
      <header className="board-head">
        <div className="grow">
          <h1 className="board-title cap">Diario · {longDate(day)}</h1>
        </div>
        <div className="row">
          <button className="tool" aria-label="Día anterior" onClick={() => dispatch({ t: 'day', day: shiftDay(day, -1) })}>‹</button>
          <button className="tool" onClick={() => dispatch({ t: 'day', day: tk })}>Hoy</button>
          <button className="tool" aria-label="Día siguiente" onClick={() => dispatch({ t: 'day', day: shiftDay(day, 1) })}>›</button>
        </div>
      </header>
      <div className="journal">
        <aside className="journal-side">
          <div className="mini-cal">
            <div className="row"><b className="grow cap">{first.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</b>
              <button className="icon-btn small" aria-label="Mes anterior" onClick={() => dispatch({ t: 'day', day: key(new Date(y, m - 2, 1)) })}>‹</button>
              <button className="icon-btn small" aria-label="Mes siguiente" onClick={() => dispatch({ t: 'day', day: key(new Date(y, m, 1)) })}>›</button>
            </div>
            <div className="mini-grid">
              {WD.map((w) => <span key={w} className="wd">{w}</span>)}
              {cells.map((d) => {
                const k = key(d);
                return (
                  <button key={k} className={'mday' + (k === day ? ' sel' : '') + (k === tk ? ' today' : '') + (d.getMonth() !== m - 1 ? ' out' : '')} onClick={() => dispatch({ t: 'day', day: k })}>
                    {d.getDate()}{has.has(k) && <i />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="small muted label">Entradas · {entries.length}</div>
          <div className="entries">
            {entries.length === 0 && <p className="small muted">Aún no hay entradas.</p>}
            {entries.map((e) => (
              <button key={e.id} className={'entry' + (e.day === day ? ' on' : '')} onClick={() => dispatch({ t: 'day', day: e.day! })}>
                <b className="cap">{longDate(e.day!).replace(/ de \d{4}$/, '')}</b>
                <span className="small muted">{firstLine(e.body)}</span>
              </button>
            ))}
          </div>
        </aside>
        <div className="journal-main">
          {card ? (
            <CardFrame card={card} flash={false} fixed />
          ) : (
            <div className="empty journal-empty">
              <h3>Sin nota este día</h3>
              <p>Empieza con la plantilla (plan del día, notas, ideas y bocetos) o en blanco.</p>
              <div className="row center">
                <button className="primary" onClick={() => { requestEdit(dailyId(day)); dispatch({ t: 'addDaily', day, body: JOURNAL_TEMPLATE }); }}>Crear con plantilla</button>
                <button className="tool" onClick={() => { requestEdit(dailyId(day)); dispatch({ t: 'addDaily', day, body: '' }); }}>En blanco</button>
              </div>
            </div>
          )}
        </div>
        <aside className="journal-cal">
          <div className="small muted label">En el calendario ese día</div>
          {dayItems.length === 0 ? <p className="small muted">Nada programado.</p> : dayItems.map((it) => (
            <div key={it.id} className="check-prog static">
              <span className="dot" style={{ background: it.color }} />
              <span className="small muted agenda-time">{it.kind === 'holiday' ? 'Festivo' : it.allDay ? 'Todo el día' : it.start ? hm(it.start) : ''}</span>
              <span className="grow">{it.title || 'Sin título'}</span>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}
