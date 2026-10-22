import { useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../../App';
import type { CheckCard, CheckItem } from '../../lib/model';
import { uid } from '../../lib/model';
import { caretLine, checklistToMarkdown, looksLikeList, parseChecklist, visualLines } from '../../lib/checklist';

/** Ajusta la altura del cuadro al texto (el texto largo se parte en varias líneas). */
function fit(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

export function CheckBody({ card }: { card: CheckCard }) {
  const { dispatch } = useApp();
  const items = card.items;
  const done = items.filter((i) => i.done && i.text).length;
  const total = items.filter((i) => i.text).length;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Ctrl+A selecciona toda la lista; Ctrl+C la copia y Ctrl+V pegado la reemplaza.
  const [allSel, setAllSel] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // El foco pasa al elemento nuevo en cuanto existe (antes de que llegue la siguiente tecla).
  const pending = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (pending.current) { document.getElementById('it-' + pending.current)?.focus(); pending.current = null; }
    root.current?.querySelectorAll<HTMLTextAreaElement>('textarea.check-text').forEach(fit);
  }, [card.items]);
  const focus = (id: string) => { pending.current = id; if (document.getElementById('it-' + id)) { document.getElementById('it-' + id)?.focus(); pending.current = null; } };

  // Hijos de cada tarea: las subtareas que la siguen hasta la próxima tarea principal.
  const kids = (idx: number) => {
    const out: typeof items = [];
    for (let k = idx + 1; k < items.length && items[k].level === 1; k++) out.push(items[k]);
    return out;
  };
  // Elementos visibles (las subtareas de una tarea plegada no cuentan para moverse con las flechas).
  const visible: string[] = [];
  {
    let hide = false;
    items.forEach((it, i) => {
      if (it.level === 0) hide = kids(i).length > 0 && collapsed.has(it.id);
      else if (hide) return;
      visible.push(it.id);
    });
  }
  const addTask = () => { const id = uid('it'); dispatch({ t: 'addCheckItem', card: card.id, after: null, id, level: 0 }); focus(id); };
  const addSub = (topId: string) => {
    const idx = items.findIndex((i) => i.id === topId);
    const last = kids(idx).pop() ?? items[idx];
    const id = uid('it');
    dispatch({ t: 'addCheckItem', card: card.id, after: last.id, id, level: 1 });
    setCollapsed((c) => { const n = new Set(c); n.delete(topId); return n; });
    focus(id);
  };
  const move = (from: string, dir: -1 | 1) => {
    const i = visible.indexOf(from) + dir;
    if (i >= 0 && i < visible.length) { const el = document.getElementById('it-' + visible[i]) as HTMLTextAreaElement | null; el?.focus(); const n = el?.value.length ?? 0; el?.setSelectionRange(n, n); return true; }
    return false;
  };

  const onCopy = (e: React.ClipboardEvent) => {
    if (!allSel) return;
    e.preventDefault();
    e.clipboardData.setData('text/plain', checklistToMarkdown(items));
  };
  const onCut = (e: React.ClipboardEvent) => {
    if (!allSel) return;
    onCopy(e);
    dispatch({ t: 'setCheckItems', card: card.id, items: [{ id: uid('it'), text: '', done: false, level: 0 }] });
    setAllSel(false);
  };
  const onPaste = (e: React.ClipboardEvent, current: CheckItem | null) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    if (!allSel && !looksLikeList(text)) return; // texto normal: lo inserta el campo
    const fresh = parseChecklist(text, () => uid('it'));
    if (!fresh.length) return;
    e.preventDefault();
    if (allSel || !current) {
      dispatch({ t: 'setCheckItems', card: card.id, items: fresh });
    } else {
      const at = items.findIndex((i) => i.id === current.id);
      // Si la tarea actual está vacía, las nuevas ocupan su lugar.
      const replace = current.text === '' ? 1 : 0;
      const after = items.slice(at + 1 - replace);
      // Una subtarea pegada tras una tarea principal vacía deja de serlo si no hay principal antes.
      dispatch({ t: 'setCheckItems', card: card.id, items: [...items.slice(0, at + 1 - replace), ...fresh, ...after] });
    }
    setAllSel(false);
    focus(fresh[fresh.length - 1].id);
  };

  let hideUntilTop = false;
  return (
    <div className={'check' + (allSel ? ' all-selected' : '')} ref={root} tabIndex={-1}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); setAllSel(true); return; }
        if (allSel && !((e.metaKey || e.ctrlKey) && ['c', 'x', 'v'].includes(e.key.toLowerCase())) && !['Control', 'Meta', 'Shift'].includes(e.key)) setAllSel(false);
      }}
      onMouseDown={() => allSel && setAllSel(false)}
      onCopy={onCopy} onCut={onCut} onPaste={(e) => { if (e.target === e.currentTarget) onPaste(e, null); }}>
      {total > 0 && (
        <div className="progress-row">
          <div className="progress" aria-label={`${done} de ${total} hechas`}><span style={{ width: `${Math.round((done / total) * 100)}%` }} /></div>
          <span className="small muted">{done}/{total}</span>
        </div>
      )}
      {items.map((it, i) => {
        if (it.level === 0) hideUntilTop = false;
        const ch = it.level === 0 ? kids(i) : [];
        if (it.level === 0 && ch.length && collapsed.has(it.id)) hideUntilTop = true;
        else if (it.level === 1 && hideUntilTop) return null;
        const doneKids = ch.filter((k) => k.done).length;
        const partial = ch.length > 0 && doneKids > 0 && doneKids < ch.length;
        const checked = ch.length ? doneKids === ch.length : it.done;
        return (
          <div key={it.id} className="check-row" style={{ paddingLeft: it.level * 22 }}>
            {it.level === 0 && (
              <>
                {ch.length > 0
                  ? <button className="fold" aria-label={collapsed.has(it.id) ? 'Desplegar subtareas' : 'Plegar subtareas'} aria-expanded={!collapsed.has(it.id)}
                      onClick={() => setCollapsed((c) => { const n = new Set(c); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; })}>{collapsed.has(it.id) ? '▸' : '▾'}</button>
                  : <span className="fold" />}
                <button className="fold add-sub" title="Añadir subtarea" aria-label="Añadir subtarea" onClick={() => addSub(it.id)}>+</button>
              </>
            )}
            <input type="checkbox" checked={checked} ref={(el) => { if (el) el.indeterminate = partial; }} aria-label="Hecha"
              onChange={() => {
                if (ch.length) ch.forEach((k) => dispatch({ t: 'checkItem', card: card.id, item: k.id, patch: { done: !checked } }));
                dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { done: !checked } });
              }} />
            <textarea
              id={'it-' + it.id}
              rows={1}
              className={'check-text' + (checked ? ' done' : '')}
              value={it.text}
              placeholder="Escribe una tarea…"
              onChange={(e) => dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { text: e.target.value.replace(/\n/g, ' ') } })}
              onPaste={(e) => { e.stopPropagation(); onPaste(e, it); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); const id = uid('it'); dispatch({ t: 'addCheckItem', card: card.id, after: ch.length ? ch[ch.length - 1].id : it.id, id, level: ch.length ? 0 : undefined }); focus(id); }
                // Tab: subtarea de la anterior; Mayús+Tab lo deshace.
                if (e.key === 'Tab') { e.preventDefault(); if (e.shiftKey) dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { level: 0 } }); else if (i > 0 && !ch.length) dispatch({ t: 'checkItem', card: card.id, item: it.id, patch: { level: 1 } }); }
                if (e.key === 'Backspace' && !it.text && items.length > 1) { e.preventDefault(); dispatch({ t: 'removeCheckItem', card: card.id, item: it.id }); const prev = items[i - 1]; if (prev) focus(prev.id); }
                // ↑ ↓ pasan a la tarea anterior o siguiente; en un texto de varias líneas, solo desde la primera o la última.
                if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
                  const el = e.currentTarget;
                  const n = visualLines(el);
                  const edge = e.key === 'ArrowUp' ? caretLine(el) === 0 : caretLine(el) >= n - 1;
                  if (edge && move(it.id, e.key === 'ArrowUp' ? -1 : 1)) e.preventDefault();
                }
              }}
            />
            {ch.length > 0 && <span className="small muted">{doneKids}/{ch.length}</span>}
          </div>
        );
      })}
      <div className="row wrap">
        <button className="link small" onClick={addTask}>+ Añadir tarea</button>
      </div>
    </div>
  );
}
