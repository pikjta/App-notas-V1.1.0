import { useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { useApp } from '../../App';
import { eraseAt, strokePath } from '../../lib/graphics';
import type { SketchCard, Stroke } from '../../lib/model';

const VW = 400, VH = 260;
const INKS = ['#1F1D1A', '#C8372D', '#F28C38', '#E2B65B', '#5E7A2E', '#2F6690', '#7A3E6B', '#FFFFFF'];
const SIZES: [number, string][] = [[2, 'Fino'], [4, 'Medio'], [8, 'Grueso']];
const TOOLS: [SketchCard['tool'], string][] = [['pen', 'Lápiz'], ['marker', 'Rotulador'], ['eraser', 'Borrador']];

export function SketchBody({ card }: { card: SketchCard }) {
  const { dispatch } = useApp();
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [confirm, setConfirm] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<SketchCard>) => dispatch({ t: 'patchCard', id: card.id, patch });

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const r = area.current!.getBoundingClientRect();
    const at = (ev: { clientX: number; clientY: number }): [number, number] => [
      Math.round(((ev.clientX - r.left) / r.width) * VW * 10) / 10,
      Math.round(((ev.clientY - r.top) / r.height) * VH * 10) / 10,
    ];
    if (card.tool === 'eraser') {
      let strokes = card.strokes;
      const erase = (ev: { clientX: number; clientY: number }) => {
        const next = eraseAt(strokes, at(ev));
        if (next.length !== strokes.length) { strokes = next; set({ strokes }); }
      };
      erase(e);
      const up = () => { window.removeEventListener('pointermove', erase); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', erase);
      window.addEventListener('pointerup', up);
      return;
    }
    const marker = card.tool === 'marker';
    const st: Stroke = { c: card.ink, s: marker ? card.size * 3 : card.size, o: marker ? 0.35 : 1, p: [at(e)] };
    setDraft({ ...st });
    const move = (ev: PointerEvent) => {
      const q = at(ev);
      const L = st.p[st.p.length - 1];
      if (Math.hypot(q[0] - L[0], q[1] - L[1]) < 1.5) return;
      st.p.push(q);
      setDraft({ ...st, p: [...st.p] });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDraft(null);
      dispatch({ t: 'addStroke', card: card.id, stroke: st });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const all = draft ? [...card.strokes, draft] : card.strokes;
  return (
    <div className="sketch">
      <div className="row wrap">
        <div className="seg">{TOOLS.map(([t, l]) => <button key={t} className={card.tool === t ? 'on' : ''} onClick={() => set({ tool: t })}>{l}</button>)}</div>
        {SIZES.map(([v, l]) => <button key={v} className={'size-btn' + (card.size === v ? ' on' : '')} title={l} aria-label={l} onClick={() => set({ size: v })}><span style={{ width: v + 3, height: v + 3 }} /></button>)}
      </div>
      <div className="row">
        {INKS.map((c) => <button key={c} className={'swatch' + (card.ink === c && card.tool !== 'eraser' ? ' on' : '')} style={{ background: c }} aria-label={'Color ' + c} onClick={() => set({ ink: c, tool: card.tool === 'eraser' ? 'pen' : card.tool })} />)}
      </div>
      <div ref={area} className={'sketch-area' + (card.tool === 'eraser' ? ' erasing' : '')} onPointerDown={down}>
        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
          {all.map((st, i) => <path key={i} d={strokePath(st.p)} fill="none" stroke={st.c} strokeWidth={st.s} strokeOpacity={st.o} strokeLinecap="round" strokeLinejoin="round" />)}
        </svg>
        {!all.length && <span className="sketch-hint">Dibuja aquí con el ratón o el lápiz</span>}
      </div>
      <div className="row">
        <button className="tool small-btn" disabled={!card.strokes.length} onClick={() => set({ strokes: card.strokes.slice(0, -1) })}>↶ Deshacer trazo</button>
        <span className="grow" />
        {confirm ? (
          <span className="confirm small">¿Borrar el dibujo?<button className="tool small-btn" onClick={() => setConfirm(false)}>No</button><button className="danger small-btn" onClick={() => { set({ strokes: [] }); setConfirm(false); }}>Borrar</button></span>
        ) : (
          <button className="tool small-btn" disabled={!card.strokes.length} onClick={() => setConfirm(true)}>Borrar todo</button>
        )}
      </div>
    </div>
  );
}
