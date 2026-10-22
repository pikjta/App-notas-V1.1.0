import { useEffect, useState } from 'react';
import { useApp } from '../App';
import { builtinTemplates } from '../lib/pmio';
import type { PmTemplate } from '../lib/pmio';

/** Elegir plantilla al crear una Tabla PM: las incluidas y las guardadas por el usuario. */
export function TemplatePicker({ onPick, onClose }: { onPick: (t: PmTemplate) => void; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [builtin] = useState(builtinTemplates);
  const [confirm, setConfirm] = useState<string | null>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal tpl-modal" role="dialog" aria-label="Nueva Tabla PM">
        <header className="modal-head"><h2>Nueva Tabla PM</h2><span className="grow" /><button className="icon-btn" aria-label="Cerrar" onClick={onClose}>✕</button></header>
        <div className="modal-body">
          <p className="small muted">Elige una plantilla para empezar. Después puedes cambiar columnas, fases y estados.</p>
          <div className="tpl-grid">
            {builtin.map((t) => (
              <button key={t.id} className="tpl" onClick={() => onPick(t)}>
                <b>{t.name}</b><span className="small muted">{t.description}</span>
              </button>
            ))}
          </div>
          {state.pmTemplates.length > 0 && (
            <>
              <div className="tpl-grid">
                {state.pmTemplates.map((t) => (
                  <div key={t.id} className="tpl mine">
                    <button className="tpl-main" onClick={() => onPick(t)}><b>{t.name}</b> <span className="badge-mine">TUYA</span><span className="small muted">{t.description}</span></button>
                    {confirm === t.id
                      ? <button className="danger small-btn" onClick={() => { dispatch({ t: 'pmTemplates', list: state.pmTemplates.filter((x) => x.id !== t.id) }); setConfirm(null); }}>Borrar</button>
                      : <button className="icon-btn small" aria-label={'Borrar la plantilla ' + t.name} onClick={() => setConfirm(t.id)}>×</button>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
