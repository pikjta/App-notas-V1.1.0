import { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { allHave, commonValue, toggleFlag } from '../lib/format';
import type { CellFmt, FmtFlag, FmtPatch } from '../lib/format';

/**
 * Barra de formato (negrita, cursiva, subrayado, tachado, color del texto, resaltado, alineación y quitar formato)
 * para lo que esté seleccionado. `fmts` es el formato actual de cada elemento seleccionado; no cambia el foco al pulsar.
 */
export function FormatBar({ fmts, onPatch, onAfter, align = false, disabled = false, label = 'Formato' }: { fmts: (CellFmt | undefined)[]; onPatch: (p: FmtPatch) => void; onAfter?: () => void; align?: boolean; disabled?: boolean; label?: string }) {
  const [picker, setPicker] = useState<'color' | 'bg' | null>(null);
  const flag = (k: FmtFlag, title: string, face: React.ReactNode) => (
    <button type="button" className={'fmt-btn' + (allHave(fmts, k) ? ' on' : '')} aria-pressed={allHave(fmts, k)} aria-label={title} title={title} disabled={disabled}
      onClick={() => { onPatch(toggleFlag(fmts, k)); onAfter?.(); }}>{face}</button>
  );
  const color = commonValue(fmts, 'color') ?? null, bg = commonValue(fmts, 'bg') ?? null, al = commonValue(fmts, 'align') ?? null;
  const alignBtn = (v: 'left' | 'center' | 'right', title: string, d: string) => (
    <button type="button" className={'fmt-btn' + (al === v ? ' on' : '')} aria-pressed={al === v} aria-label={title} title={title} disabled={disabled}
      onClick={() => { onPatch({ align: al === v ? null : v }); onAfter?.(); }}>
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" /></svg>
    </button>
  );
  const none = fmts.every((f) => !f || !Object.keys(f).length);
  return (
    <div className="fmt-bar" role="toolbar" aria-label={label} onMouseDown={(e) => e.preventDefault()}>
      {flag('b', 'Negrita', <b>B</b>)}
      {flag('i', 'Cursiva', <i>I</i>)}
      {flag('u', 'Subrayado', <u>U</u>)}
      {flag('s', 'Tachado', <s>S</s>)}
      <span className="fmt-sep" />
      <button type="button" className="fmt-btn" aria-label="Color del texto" title="Color del texto" disabled={disabled} onClick={() => setPicker('color')}>
        <span className="fmt-a">A</span><span className="fmt-under" style={{ background: color ?? 'currentColor' }} />
      </button>
      <button type="button" className="fmt-btn" aria-label="Resaltado" title="Color de fondo (resaltado)" disabled={disabled} onClick={() => setPicker('bg')}>
        <span className="fmt-a fmt-mark" style={{ background: bg ?? 'transparent' }}>A</span>
      </button>
      {align && <>
        <span className="fmt-sep" />
        {alignBtn('left', 'Alinear a la izquierda', 'M2 3h12M2 7h8M2 11h12')}
        {alignBtn('center', 'Centrar', 'M2 3h12M4 7h8M2 11h12')}
        {alignBtn('right', 'Alinear a la derecha', 'M2 3h12M6 7h8M2 11h12')}
      </>}
      <span className="fmt-sep" />
      <button type="button" className="fmt-btn" aria-label="Quitar formato" title="Quitar formato" disabled={disabled || none}
        onClick={() => { onPatch({ b: null, i: null, u: null, s: null, color: null, bg: null, align: null }); onAfter?.(); }}>✕</button>
      {picker && (
        <ColorPicker title={picker === 'color' ? 'Color del texto' : 'Color de fondo'} current={picker === 'color' ? color : bg} fallback={picker === 'color' ? '#1F1D1A' : '#FFE08A'}
          onPick={(hex) => { onPatch(picker === 'color' ? { color: hex } : { bg: hex }); setPicker(null); onAfter?.(); }}
          onClose={() => { setPicker(null); onAfter?.(); }} />
      )}
    </div>
  );
}
