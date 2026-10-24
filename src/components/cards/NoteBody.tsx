import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../../App';
import { Markdown, toggleTask } from '../../lib/markdown';
import type { NoteCard } from '../../lib/model';

export function NoteBody({ card }: { card: NoteCard }) {
  const { dispatch, resolveLink, linkTargets, editRequest, requestEdit } = useApp();
  const [editing, setEditing] = useState(false);
  // Si alguien pidió editar esta nota (nota del día recién creada), se abre con el cursor
  // al final de la primera tarea vacía o al final del texto.
  useEffect(() => {
    if (editRequest !== card.id) return;
    requestEdit(null);
    const i = card.body.indexOf('- [ ] ');
    caret.current = i >= 0 ? [i + 6, i + 6] : [card.body.length, card.body.length];
    setEditing(true);
  }, [editRequest, card.id, card.body, requestEdit]);
  // Selector de enlaces: se abre al escribir «[[»; `start` es donde empieza lo que se busca.
  const [pick, setPick] = useState<{ start: number; q: string; i: number } | null>(null);
  const [dlg, setDlg] = useState<{ q: string; cards: boolean; at: number } | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<[number, number] | null>(null);
  const pendingAct = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!editing || !ta.current) return;
    ta.current.focus();
    const [a, b] = caret.current ?? [ta.current.value.length, ta.current.value.length];
    caret.current = null;
    ta.current.setSelectionRange(a, b);
    // Si se pulsó un botón de formato sin estar editando, se aplica ahora que el cuadro de texto ya existe.
    const f = pendingAct.current; pendingAct.current = null; f?.();
  }, [editing]);
  // Posición del cursor que hay que aplicar justo después de que React actualice el texto
  // (si se aplicara más tarde, al escribir rápido el cursor saltaría hacia atrás).
  useLayoutEffect(() => {
    const el = ta.current;
    if (el && caret.current) { el.setSelectionRange(caret.current[0], caret.current[1]); caret.current = null; }
  }, [card.body]);
  const dlgOpen = useRef(false);
  dlgOpen.current = !!dlg;
  const set = (body: string, sel?: [number, number]) => { if (sel) caret.current = sel; dispatch({ t: 'patchCard', id: card.id, patch: { body } }); };

  // Formato rápido sobre la selección (igual que la minibarra de la maqueta).
  const wrap = (before: string, after = before) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    el.focus();
    set(value.slice(0, a) + before + value.slice(a, b) + after + value.slice(b), [a + before.length, b + before.length]);
  };
  const linePrefix = (prefix: string) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: a, value } = el;
    const ls = value.lastIndexOf('\n', a - 1) + 1;
    el.focus();
    set(value.slice(0, ls) + prefix + value.slice(ls), [a + prefix.length, a + prefix.length]);
  };

  const targets = pick ? linkTargets(pick.q) : [];
  const insertLink = (dest: string) => {
    const el = ta.current;
    if (!el || !pick) return;
    const caretAt = el.selectionStart;
    const v = el.value;
    const closes = v.slice(caretAt, caretAt + 2) === ']]';
    const next = v.slice(0, pick.start) + dest + ']]' + v.slice(closes ? caretAt + 2 : caretAt);
    const pos = pick.start + dest.length + 2;
    setPick(null);
    set(next, [pos, pos]);
  };
  const watchLink = (value: string, caretAt: number) => {
    if (value.slice(caretAt - 2, caretAt) === '[[') { setPick({ start: caretAt, q: '', i: 0 }); return; }
    if (pick) {
      const q = value.slice(pick.start, caretAt);
      if (caretAt < pick.start || /[\]\n]/.test(q)) setPick(null);
      else setPick({ ...pick, q, i: 0 });
    }
  };

  /** Barra de formato (Markdown): siempre visible; sin editar, el botón abre la nota para escribir. */
  const act = (fn: () => void) => { if (editing) { fn(); return; } pendingAct.current = fn; caret.current = [card.body.length, card.body.length]; setEditing(true); };
  const noteBar = (
    <div className="mini-bar" onMouseDown={(e) => e.preventDefault()}>
        <button onClick={() => act(() => linePrefix('## '))} title="Título" aria-label="Título">H</button>
        <button onClick={() => act(() => wrap('**'))} title="Negrita (⌘B)"><b>B</b></button>
        <button onClick={() => act(() => wrap('*'))} title="Cursiva (⌘I)"><i>I</i></button>
        <button onClick={() => act(() => wrap('~~'))} title="Tachado"><s>S</s></button>
        <button onClick={() => act(() => wrap('`'))} title="Código" aria-label="Código">{'<>'}</button>
        <button onClick={() => act(() => linePrefix('- '))} title="Lista" aria-label="Lista">•</button>
        <button onClick={() => act(() => linePrefix('- [ ] '))} title="Casilla de tarea" aria-label="Casilla de tarea">☐</button>
        <button onClick={() => act(() => linePrefix('> '))} title="Cita" aria-label="Cita">❝</button>
        <button title="Enlace" aria-label="Enlace" onClick={() => act(() => {
          const el = ta.current;
          if (!el) return;
          const { selectionStart: a, selectionEnd: b, value } = el;
          const text = value.slice(a, b) || 'texto';
          el.focus();
          set(value.slice(0, a) + '[' + text + '](https://)' + value.slice(b), [a + text.length + 4, a + text.length + 12]);
        })}>🔗</button>
        <button title="Enlace a otra tarea principal [[ ]]" aria-label="Enlace a otra tarea principal" onClick={() => act(() => setDlg({ q: '', cards: true, at: ta.current?.selectionStart ?? card.body.length }))}>[[ ]]</button>
        {editing && <button className="grow-btn" title="Listo" aria-label="Listo" onClick={() => { setPick(null); setEditing(false); }}>Listo</button>}
      </div>
  );

  if (!editing) {
    return (
      <div className="note-edit">
        {noteBar}
      <div className="note-view" onClick={() => setEditing(true)} title="Haz clic en el texto para editar">
        {card.body.trim() ? <Markdown body={card.body} link={resolveLink} onToggle={(line) => set(toggleTask(card.body, line))} /> : <span className="muted">Nota vacía. Haz clic para escribir en Markdown.</span>}
      </div>
      </div>
    );
  }
  return (
    <div className="note-edit">
      {noteBar}
      <textarea
        ref={ta}
        value={card.body}
        onChange={(e) => { set(e.target.value); watchLink(e.target.value, e.target.selectionStart); }}
        onBlur={() => { if (dlgOpen.current) return; setPick(null); setEditing(false); }}
        onKeyDown={(e) => {
          if (pick && targets.length) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setPick({ ...pick, i: Math.min(targets.length - 1, pick.i + 1) }); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setPick({ ...pick, i: Math.max(0, pick.i - 1) }); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertLink(targets[pick.i].dest); return; }
          }
          if (pick && e.key === 'Escape') { e.preventDefault(); setPick(null); return; }
          const mod = e.metaKey || e.ctrlKey;
          if (mod && e.key.toLowerCase() === 'b') { e.preventDefault(); wrap('**'); }
          if (mod && e.key.toLowerCase() === 'i') { e.preventDefault(); wrap('*'); }
          if (e.key === 'Escape') ta.current?.blur();
          if (e.key === 'Enter' && !e.shiftKey) {
            // Enter continúa listas y tareas.
            const el = e.currentTarget;
            const ls = el.value.lastIndexOf('\n', el.selectionStart - 1) + 1;
            const m = el.value.slice(ls, el.selectionStart).match(/^(\s*)(- \[[ xX]\] |- |\d+\. )/);
            if (m) {
              e.preventDefault();
              const next = m[2].startsWith('- [') ? '- [ ] ' : /\d/.test(m[2]) ? `${parseInt(m[2], 10) + 1}. ` : m[2];
              const ins = '\n' + m[1] + next;
              const pos = el.selectionStart + ins.length;
              set(el.value.slice(0, el.selectionStart) + ins + el.value.slice(el.selectionEnd), [pos, pos]);
            }
          }
        }}
        rows={Math.max(6, card.body.split('\n').length + 1)}
        aria-label="Contenido de la nota (Markdown)"
      />
      {dlg && (() => {
        const all = linkTargets(dlg.q).filter((t) => dlg.cards || t.kind === 'Tarea principal' || t.kind === 'Nota diaria');
        const close = () => { setDlg(null); window.setTimeout(() => ta.current?.focus(), 0); };
        const choose = (t: { dest: string; label: string }) => {
          const v = card.body, at = dlg.at;
          const ins = `[[${t.dest}|${t.label.replace(/^Diario · .*/, 'diario')}]]`;
          const pos = at + ins.length;
          setDlg(null);
          set(v.slice(0, at) + ins + v.slice(at), [pos, pos]);
          window.setTimeout(() => ta.current?.focus(), 0);
        };
        return (
          <div className="link-dlg" role="dialog" aria-label="Enlazar a…">
            <h3>Enlazar a…</h3>
            <input autoFocus value={dlg.q} placeholder="Buscar tarea principal o tarjeta…" aria-label="Buscar tarea principal o tarjeta" onChange={(e) => setDlg({ ...dlg, q: e.target.value })} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } if (e.key === 'Enter' && all[0]) choose(all[0]); }} />
            <label className="small"><input type="checkbox" checked={dlg.cards} onChange={(e) => setDlg({ ...dlg, cards: e.target.checked })} /> Incluir tarjetas</label>
            <div className="link-pick static" role="listbox">
              {all.length === 0 && <div className="muted small pad">Nada coincide.</div>}
              {all.map((t) => (
                <button key={t.dest} role="option" aria-selected="false" onClick={() => choose(t)}>
                  <span className="dot" style={{ background: t.color }} /><span className="grow">{t.label}</span><span className="small muted">{t.kind}</span>
                </button>
              ))}
            </div>
            <div className="row-end"><button className="tool small-btn" onClick={close}>Cancelar</button></div>
          </div>
        );
      })()}
      {pick && (
        <div className="link-pick" role="listbox" aria-label="Enlazar con" onMouseDown={(e) => e.preventDefault()}>
          {targets.length === 0 && <div className="muted small pad">Nada coincide con «{pick.q}».</div>}
          {targets.map((t, k) => (
            <button key={t.dest} role="option" aria-selected={k === pick.i} className={k === pick.i ? 'on' : ''} onClick={() => insertLink(t.dest)}>
              <span className="dot" style={{ background: t.color }} /><span className="grow">{t.label}</span><span className="small muted">{t.kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
