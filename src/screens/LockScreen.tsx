import { useState } from 'react';
import { useApp } from '../App';
import { errorText } from '../lib/backend';
import { strength } from '../lib/password';
import { StrengthBar } from './Settings';

export function LockScreen({ onUnlocked }: { onUnlocked: () => Promise<void> }) {
  const { backend } = useApp();
  const [mode, setMode] = useState<'pw' | 'rec'>('pw');
  const [pw, setPw] = useState('');
  const [words, setWords] = useState('');
  const [np, setNp] = useState('');
  const [np2, setNp2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const unlock = async () => {
    if (!pw || busy) return;
    setBusy(true); setErr('');
    try { await backend.unlock(pw); setPw(''); await onUnlocked(); }
    catch (e) { setErr(errorText(e)); setPw(''); }
    finally { setBusy(false); }
  };

  const recover = async () => {
    if (busy) return;
    if (strength(np).level < 1) { setErr('La contraseña nueva debe tener al menos 10 caracteres.'); return; }
    if (np !== np2) { setErr('Las contraseñas nuevas no coinciden.'); return; }
    setBusy(true); setErr('');
    try { await backend.recover(words, np); setWords(''); setNp(''); setNp2(''); await onUnlocked(); }
    catch (e) { setErr(errorText(e)); }
    finally { setBusy(false); }
  };

  const count = words.trim() ? words.trim().split(/[\s,.]+/).filter((w) => !/^\d+$/.test(w)).length : 0;

  return (
    <div className="lock" role="dialog" aria-label="Cuaderno bloqueado">
      <section className="lock-box">
        <h1>Cuaderno</h1>
        <p className="muted">Tus datos están cifrados en este dispositivo.</p>
        {mode === 'pw' ? (
          <>
            <input type="password" autoFocus value={pw} placeholder="Contraseña" aria-label="Contraseña" autoComplete="current-password"
              onChange={(e) => { setPw(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && void unlock()} />
            {err && <p className="err">{err}</p>}
            <button className="primary" disabled={busy || !pw} onClick={() => void unlock()}>{busy ? 'Descifrando…' : 'Desbloquear'}</button>
            <button className="link" onClick={() => { setMode('rec'); setErr(''); }}>¿Olvidaste la contraseña? Usar las 24 palabras</button>
          </>
        ) : (
          <>
            <p>Escribe tus 24 palabras de recuperación en orden. No importan las tildes ni las mayúsculas.</p>
            <textarea value={words} onChange={(e) => { setWords(e.target.value); setErr(''); }} spellCheck={false} autoComplete="off" aria-label="Palabras de recuperación" rows={4} />
            <span className="muted small">{count} de 24 palabras</span>
            <input type="password" value={np} placeholder="Contraseña nueva" aria-label="Contraseña nueva" autoComplete="new-password" onChange={(e) => setNp(e.target.value)} />
            <StrengthBar pw={np} />
            <input type="password" value={np2} placeholder="Repite la contraseña nueva" aria-label="Repite la contraseña nueva" autoComplete="new-password" onChange={(e) => setNp2(e.target.value)} />
            {err && <p className="err">{err}</p>}
            <button className="primary" disabled={busy} onClick={() => void recover()}>{busy ? 'Comprobando…' : 'Recuperar acceso'}</button>
            <button className="link" onClick={() => { setMode('pw'); setErr(''); }}>Volver a la contraseña</button>
          </>
        )}
      </section>
    </div>
  );
}
