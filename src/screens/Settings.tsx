import { useEffect, useState } from 'react';
import { useApp } from '../App';
import { errorText } from '../lib/backend';
import type { BackupInfo, SnapshotInfo } from '../lib/backend';
import { pickChecks, strength } from '../lib/password';
import { notificationsAllowed, notify, playChime } from '../lib/notify';
import { COUNTRIES } from '../lib/holidays';
import type { Country } from '../lib/holidays';
import { AUTO_EVERY, INTERNAL_EVERY, LANGUAGES, starterDocs } from '../lib/model';
import type { Language } from '../lib/model';
import { GRID_SIZES } from '../lib/appearance';

export type SettingsTab = 'general' | 'remind' | 'board' | 'backup' | 'security' | 'data';
type Tab = SettingsTab;

export function StrengthBar({ pw }: { pw: string }) {
  if (!pw) return null;
  const s = strength(pw);
  const colors = ['#C8372D', '#E2A23B', '#5E7A2E', '#2F7D4F'];
  return (
    <div className="strength">
      <div className="strength-track"><span style={{ width: `${[15, 40, 70, 100][s.level]}%`, background: colors[s.level] }} /></div>
      <span style={{ color: colors[s.level] }}>{s.label}</span>
    </div>
  );
}

const TABS: { id: Tab; name: string }[] = [
  { id: 'general', name: 'General' }, { id: 'remind', name: 'Recordatorios' }, { id: 'board', name: 'Tablero' },
  { id: 'backup', name: 'Backup' }, { id: 'security', name: 'Seguridad' }, { id: 'data', name: 'Datos' },
];

export function Settings({ tab, setTab, onClose }: { tab: Tab; setTab: (t: Tab) => void; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-label="Ajustes">
        <header className="modal-head">
          <div><h2>Ajustes</h2><p className="muted small settings-sub">Los cambios se guardan al instante, solo en este dispositivo.</p></div>
          <nav className="tabs" aria-label="Secciones">
            {TABS.map((t) => <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.name}</button>)}
          </nav>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>✕</button>
        </header>
        <div className="modal-body">
          {tab === 'general' ? <General /> : tab === 'remind' ? <RemindSettings /> : tab === 'board' ? <BoardSettings /> : tab === 'backup' ? <Backups /> : tab === 'security' ? <Security /> : <DataSettings setTab={setTab} />}
        </div>
      </section>
    </div>
  );
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={'switch' + (on ? ' on' : '')} onClick={() => onChange(!on)}><span /></button>;
}

function General() {
  const { state, dispatch } = useApp();
  const s = state.settings;
  const [q, setQ] = useState('');
  const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const list = (Object.keys(COUNTRIES) as Country[]).filter((c) => norm(COUNTRIES[c].name).includes(norm(q)));
  return (
    <div className="stack">
      <div className="srow">
        <div><h3>Idioma</h3><p className="muted">De momento los textos de la app están solo en español.</p></div>
        <select value={s.lang} aria-label="Idioma" onChange={(e) => dispatch({ t: 'settings', patch: { lang: e.target.value as Language } })}>
          {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div className="srow">
        <div><h3>Formato de hora</h3></div>
        <div className="seg" role="group" aria-label="Formato de hora">
          <button className={!s.hour12 ? 'on' : ''} onClick={() => dispatch({ t: 'settings', patch: { hour12: false } })}>24 h</button>
          <button className={s.hour12 ? 'on' : ''} onClick={() => dispatch({ t: 'settings', patch: { hour12: true } })}>12 h</button>
        </div>
      </div>
      <div className="srow">
        <div><h3>Primer día de la semana</h3></div>
        <div className="seg" role="group" aria-label="Primer día de la semana">
          <button className={s.weekStart === 1 ? 'on' : ''} onClick={() => dispatch({ t: 'settings', patch: { weekStart: 1 } })}>Lunes</button>
          <button className={s.weekStart === 0 ? 'on' : ''} onClick={() => dispatch({ t: 'settings', patch: { weekStart: 0 } })}>Domingo</button>
        </div>
      </div>
      <div className="stack small-gap">
        <div><h3>Localización</h3><p className="muted">País para los festivos del calendario.</p></div>
        <input type="search" value={q} placeholder="Buscar país…" aria-label="Buscar país" onChange={(e) => setQ(e.target.value)} />
        <div className="country-list" role="listbox" aria-label="País">
          {list.map((c) => (
            <button key={c} role="option" aria-selected={s.country === c} className={'country' + (s.country === c ? ' on' : '')} onClick={() => dispatch({ t: 'settings', patch: { country: c } })}>
              <span>{COUNTRIES[c].flag} {COUNTRIES[c].name}</span><span className="tag-mini">Festivos</span>
            </button>
          ))}
          {!list.length && <p className="muted small">Sin resultados para «{q}».</p>}
        </div>
      </div>
    </div>
  );
}

function BoardSettings() {
  const { state, dispatch } = useApp();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => dispatch({ t: 'settings', patch });
  return (
    <div className="stack">
      <div className="srow">
        <div><h3>Efecto foco</h3><p className="muted">Al pasar el cursor por una tarjeta, las demás se atenúan.</p></div>
        <div className="seg" role="group" aria-label="Efecto foco">
          {([['off', 'Desactivado'], ['soft', 'Suave'], ['strong', 'Intenso']] as const).map(([k, n]) => <button key={k} className={s.focus === k ? 'on' : ''} onClick={() => set({ focus: k })}>{n}</button>)}
        </div>
      </div>
      <div className="srow">
        <div><h3>Imán activado al abrir</h3><p className="muted">Las tarjetas se alinean a una cuadrícula invisible al moverlas.</p></div>
        <Switch on={s.snapOnOpen} label="Imán activado al abrir" onChange={(v) => set({ snapOnOpen: v, snap: v })} />
      </div>
      <div className="srow">
        <div><h3>Tamaño de la cuadrícula</h3></div>
        <div className="seg" role="group" aria-label="Tamaño de la cuadrícula">
          {GRID_SIZES.map((g) => <button key={g.value} className={s.grid === g.value ? 'on' : ''} onClick={() => set({ grid: g.value })}>{g.name}</button>)}
        </div>
      </div>
      <div className="srow">
        <div><h3>Reducir animaciones</h3><p className="muted">Quita transiciones y movimientos.</p></div>
        <Switch on={s.reduceMotion} label="Reducir animaciones" onChange={(v) => set({ reduceMotion: v })} />
      </div>
    </div>
  );
}

function DataSettings({ setTab }: { setTab: (t: Tab) => void }) {
  const { backend, reload, toast } = useApp();
  const [bytes, setBytes] = useState<number | null>(null);
  const [step, setStep] = useState<'idle' | 'ask' | 'busy'>('idle');
  useEffect(() => { backend.all().then((d) => setBytes(new Blob([JSON.stringify(d)]).size)).catch(() => setBytes(null)); }, [backend]);
  const size = bytes === null ? '…' : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const wipe = async () => {
    setStep('busy');
    try {
      const ids = (await backend.all()).map((d) => d.id);
      await backend.remove(ids);
      await backend.put(starterDocs());
      await reload();
      toast('Todos los datos se han borrado');
    } finally { setStep('idle'); }
  };
  return (
    <div className="stack">
      <div className="srow">
        <div><h3>Copia de seguridad manual</h3><p className="muted">Guarda o restaura una copia cuando tú decidas.</p></div>
        <button className="tool" onClick={() => setTab('backup')}>Abrir</button>
      </div>
      <div className="srow">
        <div><h3>Espacio usado</h3><p className="muted">Datos guardados en este ordenador.</p></div>
        <b>{size}</b>
      </div>
      <div className="srow">
        <div><h3>Borrar todos los datos</h3><p className="muted">{step === 'ask' ? '¿Seguro? Te recomendamos exportar una copia antes.' : 'Elimina todo lo guardado en este ordenador.'}</p></div>
        {step === 'idle' && <button className="danger" onClick={() => setStep('ask')}>Borrar…</button>}
        {step !== 'idle' && <div className="row"><button className="tool" disabled={step === 'busy'} onClick={() => setStep('idle')}>Cancelar</button><button className="danger" disabled={step === 'busy'} onClick={() => void wipe()}>Sí, borrar todo</button></div>}
      </div>
    </div>
  );
}

type Step =
  | { s: 'idle' }
  | { s: 'intro'; agree: boolean }
  | { s: 'password'; pw: string; pw2: string }
  | { s: 'words'; words: string[]; rotate: boolean }
  | { s: 'verify'; words: string[]; picks: number[]; answers: string[]; rotate: boolean }
  | { s: 'change' } | { s: 'rotate' } | { s: 'disable' };

function Security() {
  const { backend, status, refreshStatus, state, dispatch, toast, copy, lock } = useApp();
  const [step, setStep] = useState<Step>({ s: 'idle' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const reset = () => { setStep({ s: 'idle' }); setErr(''); setCur(''); setPw(''); setPw2(''); };
  const cancelSetup = () => { void backend.vaultCancel(); reset(); };

  const minutes = state.settings.autoLockMinutes;

  if (step.s === 'intro') {
    return (
      <div className="stack">
        <div className="warn">
          <h3>Antes de activar el cifrado</h3>
          <p>Tus datos se cifrarán con una contraseña. Recibirás también <b>24 palabras de recuperación</b>, como las de una billetera de criptomonedas. Si olvidas la contraseña, esas palabras son la <b>única</b> forma de volver a entrar: nadie más puede abrir tus datos.</p>
          <label className="check-line"><input type="checkbox" checked={step.agree} onChange={() => setStep({ s: 'intro', agree: !step.agree })} /> Entiendo que si pierdo la contraseña y las 24 palabras, pierdo mis datos.</label>
        </div>
        <div className="row-end"><button className="tool" onClick={reset}>Cancelar</button><button className="primary" disabled={!step.agree} onClick={() => setStep({ s: 'password', pw: '', pw2: '' })}>Continuar</button></div>
      </div>
    );
  }
  if (step.s === 'password') {
    return (
      <div className="stack">
        <h3>1 · Elige una contraseña</h3>
        <input type="password" autoFocus value={step.pw} placeholder="Contraseña (mínimo 10 caracteres)" autoComplete="new-password" onChange={(e) => setStep({ ...step, pw: e.target.value })} />
        <StrengthBar pw={step.pw} />
        <input type="password" value={step.pw2} placeholder="Repite la contraseña" autoComplete="new-password" onChange={(e) => setStep({ ...step, pw2: e.target.value })} />
        <p className="muted small">Una frase larga y fácil de recordar es más segura que una palabra corta con símbolos.</p>
        {err && <p className="err">{err}</p>}
        <div className="row-end">
          <button className="tool" onClick={reset}>Cancelar</button>
          <button className="primary" disabled={busy} onClick={() => run(async () => {
            if (step.pw !== step.pw2) throw 'Las contraseñas no coinciden.';
            const words = await backend.vaultPrepare(step.pw);
            setStep({ s: 'words', words, rotate: false });
          })}>{busy ? 'Generando…' : 'Continuar'}</button>
        </div>
      </div>
    );
  }
  if (step.s === 'words') {
    return (
      <div className="stack">
        <h3>{step.rotate ? 'Tus nuevas 24 palabras' : '2 · Tus 24 palabras de recuperación'}</h3>
        <p>Escríbelas en papel o guárdalas en un gestor de contraseñas, <b>en orden</b>. No las guardes en este ordenador ni las compartas.</p>
        <ol className="words">{step.words.map((w, i) => <li key={i}><span>{i + 1}</span>{w}</li>)}</ol>
        <div className="row wrap no-print">
          <button className="tool small-btn" onClick={() => copy(step.words.join(' '), 'Palabras copiadas')}>Copiar</button>
          <button className="tool small-btn" onClick={() => saveWords(step.words)}>Descargar .txt</button>
          <button className="tool small-btn" onClick={() => window.print()}>Imprimir</button>
        </div>
        <div className="row-end">
          {!step.rotate && <button className="tool" onClick={cancelSetup}>Cancelar</button>}
          <button className="primary" onClick={() => setStep({ s: 'verify', words: step.words, picks: pickChecks(), answers: ['', '', ''], rotate: step.rotate })}>Ya las he guardado</button>
        </div>
      </div>
    );
  }
  if (step.s === 'verify') {
    return (
      <div className="stack">
        <h3>{step.rotate ? 'Comprueba tu copia' : '3 · Comprueba tu copia'}</h3>
        <p className="muted">Escribe estas tres palabras de tu lista.</p>
        <div className="verify">
          {step.picks.map((p, k) => (
            <label key={p}>Palabra n.º {p + 1}
              <input value={step.answers[k]} autoComplete="off" spellCheck={false} onChange={(e) => { const a = step.answers.slice(); a[k] = e.target.value; setStep({ ...step, answers: a }); setErr(''); }} />
            </label>
          ))}
        </div>
        {err && <p className="err">{err}</p>}
        <div className="row-end">
          <button className="tool" onClick={() => setStep({ s: 'words', words: step.words, rotate: step.rotate })}>Ver las palabras</button>
          <button className="primary" disabled={busy} onClick={() => run(async () => {
            if (step.rotate) {
              const norm = (w: string) => w.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
              step.picks.forEach((p, k) => { if (norm(step.words[p]) !== norm(step.answers[k])) throw `La palabra n.º ${p + 1} no coincide.`; });
            } else {
              await backend.vaultConfirm(step.picks.map((p, k) => [p, step.answers[k]] as [number, string]));
              await refreshStatus();
            }
            toast(step.rotate ? 'Palabras nuevas guardadas · las anteriores ya no sirven' : 'Cifrado activado');
            reset();
          })}>{busy ? 'Cifrando…' : step.rotate ? 'Confirmar' : 'Confirmar y cifrar'}</button>
        </div>
      </div>
    );
  }
  if (step.s === 'change' || step.s === 'rotate' || step.s === 'disable') {
    const title = { change: 'Cambiar la contraseña', rotate: 'Generar palabras nuevas', disable: 'Desactivar el cifrado' }[step.s];
    return (
      <div className="stack">
        <h3>{title}</h3>
        {step.s === 'rotate' && <p className="muted">Las palabras actuales dejarán de abrir este cuaderno. Las copias antiguas se siguen abriendo con las palabras de su momento.</p>}
        <input type="password" autoFocus value={cur} placeholder="Contraseña actual" autoComplete="current-password" onChange={(e) => setCur(e.target.value)} />
        {step.s === 'change' && (
          <>
            <input type="password" value={pw} placeholder="Contraseña nueva" autoComplete="new-password" onChange={(e) => setPw(e.target.value)} />
            <StrengthBar pw={pw} />
            <input type="password" value={pw2} placeholder="Repite la contraseña nueva" autoComplete="new-password" onChange={(e) => setPw2(e.target.value)} />
          </>
        )}
        {err && <p className="err">{err}</p>}
        <div className="row-end">
          <button className="tool" onClick={reset}>Cancelar</button>
          <button className={step.s === 'disable' ? 'danger' : 'primary'} disabled={busy} onClick={() => run(async () => {
            if (step.s === 'change') {
              if (pw !== pw2) throw 'Las contraseñas nuevas no coinciden.';
              await backend.changePassword(cur, pw); toast('Contraseña cambiada'); reset();
            } else if (step.s === 'rotate') {
              const words = await backend.rotateWords(cur); setCur(''); setStep({ s: 'words', words, rotate: true });
            } else {
              await backend.disable(cur); await refreshStatus(); toast('Cifrado desactivado'); reset();
            }
          })}>{busy ? 'Un momento…' : step.s === 'disable' ? 'Desactivar' : 'Continuar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      {!status.encrypted ? (
        <div className="srow">
          <div><h3>Cifrado con contraseña</h3><p className="muted">Cifra tus datos y tus copias de seguridad. Al abrir la app se pedirá la contraseña. Es opcional.</p></div>
          <button className="primary" onClick={() => setStep({ s: 'intro', agree: false })}>Activar…</button>
        </div>
      ) : (
        <>
          <div className="srow">
            <div>
              <h3 className="ok">✓ Cifrado activado</h3>
              <p className="muted small">AES-256-GCM · contraseña con Argon2id (64 MiB) · recuperación con 24 palabras BIP-39.</p>
            </div>
            <button className="tool" onClick={() => void lock()}>Bloquear ahora</button>
          </div>
          <div className="srow">
            <div><h3>Bloqueo automático</h3><p className="muted">Bloquea la app tras un tiempo sin usarla.</p></div>
            <div className="row">
              {minutes !== null && (
                <select value={minutes} onChange={(e) => dispatch({ t: 'settings', patch: { autoLockMinutes: Number(e.target.value) } })} aria-label="Tiempo sin uso">
                  {[[5, '5 minutos'], [15, '15 minutos'], [30, '30 minutos'], [60, '1 hora'], [120, '2 horas'], [240, '4 horas']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
              <button role="switch" aria-checked={minutes !== null} className={'switch' + (minutes !== null ? ' on' : '')} aria-label="Bloqueo automático"
                onClick={() => dispatch({ t: 'settings', patch: { autoLockMinutes: minutes === null ? 15 : null } })}><span /></button>
            </div>
          </div>
          <div className="srow"><div><h3>Contraseña</h3><p className="muted">Cambiarla no obliga a volver a cifrar los datos.</p></div><button className="tool" onClick={() => setStep({ s: 'change' })}>Cambiar…</button></div>
          <div className="srow"><div><h3>Palabras de recuperación</h3><p className="muted">Genera 24 palabras nuevas si crees que las anteriores se han visto.</p></div><button className="tool" onClick={() => setStep({ s: 'rotate' })}>Generar nuevas…</button></div>
          <div className="srow"><div><h3>Desactivar el cifrado</h3><p className="muted">Tus datos volverán a guardarse sin cifrar.</p></div><button className="tool danger-text" onClick={() => setStep({ s: 'disable' })}>Desactivar…</button></div>
        </>
      )}
    </div>
  );
}

function saveWords(words: string[]) {
  try {
    const text = 'Cuaderno · palabras de recuperación\n\n' + words.map((w, i) => `${i + 1}. ${w}`).join('\n') + '\n';
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = 'cuaderno_palabras.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch { /* sin descarga en las pruebas */ }
}

function Backups() {
  const { state, dispatch, backend, status, reload, toast, backupNow, snapshotNow } = useApp();
  const bk = state.settings.backup;
  const setBk = (patch: Partial<typeof bk>) => dispatch({ t: 'settings', patch: { backup: { ...bk, ...patch } } });
  const setAuto = (patch: Partial<typeof bk.auto>) => setBk({ auto: { ...bk.auto, ...patch } });
  const setInternal = (patch: Partial<typeof bk.internal>) => setBk({ internal: { ...bk.internal, ...patch } });
  const [downloads, setDownloads] = useState('Descargas');
  useEffect(() => { backend.downloadsDir().then(setDownloads).catch(() => undefined); }, [backend]);
  const dir = bk.dir ?? downloads;
  const fmt = (t: number) => new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const stamp = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  // Copias internas
  const [snaps, setSnaps] = useState<SnapshotInfo[] | null>(null);
  const [askRestore, setAskRestore] = useState<number | null>(null);
  useEffect(() => { backend.snapshotList().then(setSnaps).catch(() => setSnaps(null)); }, [backend, bk.internal.last]);

  // Exportar / importar
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [info, setInfo] = useState<(BackupInfo & { path: string }) | null>(null);
  const [ready, setReady] = useState(false);
  const [secret, setSecret] = useState('');
  const [useWords, setUseWords] = useState(false);

  const pickFolder = async () => { const d = await backend.pickFolder(); if (d) setBk({ dir: d }); };
  const exportNow = async () => {
    setErr(''); setBusy('export');
    try {
      const name = await backend.manualBackup(dir, stamp());
      dispatch({ t: 'backupDone', level: 'manual', patch: { last: Date.now(), lastName: name } });
      setExporting(false); toast('Copia creada');
    } catch (e) { setErr(errorText(e)); } finally { setBusy(null); }
  };
  const choose = async () => {
    setErr(''); setSecret(''); setReady(false); setInfo(null);
    try {
      const path = await backend.pickOpenPath();
      if (path) setInfo({ ...(await backend.backupInspect(path)), path });
    } catch (e) { setErr(/copia|Cuaderno/i.test(errorText(e)) ? 'Este archivo no parece una copia de Cuaderno.' : 'No se pudo leer el archivo'); }
  };
  const importNow = async () => {
    if (!info) return;
    setBusy('import'); setErr('');
    try {
      const n = await backend.backupImport(info.path, info.encrypted ? secret : null, useWords);
      await reload(); setInfo(null); setReady(false); setSecret(''); setImporting(false); toast(`Copia importada · ${n} elementos`);
    } catch (e) { setErr(errorText(e)); } finally { setBusy(null); }
  };
  const restore = async (id: number) => {
    setBusy('restore'); setErr('');
    try { await backend.snapshotRestore(id, bk.internal.keep); await reload(); setAskRestore(null); toast('Copia interna restaurada'); }
    catch (e) { setErr(errorText(e)); } finally { setBusy(null); }
  };
  const keepSlider = (value: number, onChange: (n: number) => void, label: string) => (
    <label className="small">Conservar las últimas {value}
      <input type="range" min={20} max={100} step={5} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );

  return (
    <div className="stack">
      <p className="muted">Tus datos viven solo en este ordenador. Las copias te protegen si algo falla{status.encrypted ? '; se guardan cifradas como el cuaderno' : ''}.</p>

      <div className="srow">
        <div>
          <h3>Carpeta de las copias</h3>
          <code className="ellipsis" title={dir}>{dir}</code>
          <ul className="bk-tree small muted">
            <li>backup automático</li><li>backup interno</li><li>backup manual</li>
          </ul>
        </div>
        <div className="row">
          <button className="tool" onClick={() => void pickFolder()}>Elegir carpeta…</button>
          {bk.dir && <button className="tool" onClick={() => setBk({ dir: null })}>Volver a Descargas</button>}
        </div>
      </div>

      <div className="auto-bk">
        <div className="srow">
          <div><h3>Activar backup automático</h3><p className="muted">Un archivo en «backup automático», con la frecuencia que elijas.</p></div>
          <Switch on={bk.auto.on} label="Activar backup automático" onChange={(v) => setAuto({ on: v })} />
        </div>
        {bk.auto.on && (
          <div className="stack small-gap auto-bk-body">
            <div className="row wrap">
              <label className="small">Frecuencia
                <select value={bk.auto.every} onChange={(e) => setAuto({ every: e.target.value as typeof bk.auto.every })}>
                  {AUTO_EVERY.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              {keepSlider(bk.auto.keep, (n) => setAuto({ keep: n }), 'Conservar copias automáticas')}
              <span className="grow" />
              <button className="primary small-btn" disabled={busy === 'auto'} onClick={async () => { setBusy('auto'); await backupNow(); setBusy(null); }}>{busy === 'auto' ? 'Guardando…' : 'Hacer copia ahora'}</button>
            </div>
            {bk.auto.error ? <p className="err small">Última copia fallida: {bk.auto.error}</p> : bk.auto.last && <p className="small ok">Última copia: {fmt(bk.auto.last)} · {bk.auto.lastName}</p>}
          </div>
        )}
      </div>

      <div className="auto-bk">
        <div className="srow">
          <div><h3>Activar backup interno</h3><p className="muted">Fotos de tus datos guardadas dentro de la base de datos, y además un archivo en «backup interno».</p></div>
          <Switch on={bk.internal.on} label="Activar backup interno" onChange={(v) => setInternal({ on: v })} />
        </div>
        {bk.internal.on && (
          <div className="stack small-gap auto-bk-body">
            <div className="row wrap">
              <label className="small">Cada
                <select value={bk.internal.everyMin} onChange={(e) => setInternal({ everyMin: Number(e.target.value) })}>
                  {INTERNAL_EVERY.map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
                </select>
              </label>
              {keepSlider(bk.internal.keep, (n) => setInternal({ keep: n }), 'Conservar copias internas')}
              <span className="grow" />
              <button className="tool small-btn" disabled={busy === 'internal'} onClick={async () => { setBusy('internal'); await snapshotNow(); setSnaps(await backend.snapshotList().catch(() => null)); setBusy(null); }}>Crear copia ahora</button>
            </div>
          </div>
        )}
        {snaps && snaps.length > 0 && (
          <div className="stack small-gap auto-bk-body">
            <h3>Copias internas recientes · {snaps.length}</h3>
            {snaps.slice(0, 5).map((x) => (
              <div className="row wrap" key={x.id}>
                <span className="small grow">{fmt(x.at)} · {x.docs} elementos</span>
                {askRestore === x.id
                  ? <><span className="small">¿Restaurar?</span><button className="danger small-btn" disabled={busy === 'restore'} onClick={() => void restore(x.id)}>Sí, restaurar</button><button className="tool small-btn" onClick={() => setAskRestore(null)}>No</button></>
                  : <button className="tool small-btn" onClick={() => setAskRestore(x.id)}>Restaurar</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="srow">
        <div><h3>Exportar copia</h3><p className="muted">Un archivo en «backup manual»{status.encrypted ? ', cifrado: se abre con la contraseña o las palabras de hoy' : ''}.{bk.manual.last ? ` Última: ${fmt(bk.manual.last)}.` : ''}</p></div>
        {exporting
          ? <div className="row"><button className="tool" onClick={() => setExporting(false)}>Cancelar</button><button className="primary" disabled={busy === 'export'} onClick={() => void exportNow()}>Exportar ahora</button></div>
          : <button className="primary" onClick={() => setExporting(true)}>Exportar copia</button>}
      </div>

      <div className="srow">
        <div><h3>Importar copia</h3><p className="muted">Reemplaza todos los datos actuales por los de la copia.</p></div>
        {importing
          ? <button className="tool" onClick={() => { setImporting(false); setInfo(null); setReady(false); setErr(''); }}>Cancelar</button>
          : <button className="tool" onClick={() => { setImporting(true); }}>Importar copia</button>}
      </div>
      {importing && !info && <div className="row"><button className="tool" onClick={() => void choose()}>Elegir archivo…</button></div>}
      {importing && info && info.encrypted && !ready && (
        <div className="warn">
          <h3>Copia cifrada</h3>
          {useWords ? <textarea rows={3} value={secret} onChange={(e) => setSecret(e.target.value)} aria-label="Palabras de la copia" /> : <input type="password" value={secret} placeholder="Contraseña de la copia" aria-label="Contraseña de la copia" onChange={(e) => setSecret(e.target.value)} />}
          <div className="row-end">
            <button className="tool" onClick={() => setUseWords(!useWords)}>{useWords ? 'Usar la contraseña' : 'Usar las 24 palabras'}</button>
            <button className="primary" disabled={!secret.trim()} onClick={() => setReady(true)}>Descifrar</button>
          </div>
        </div>
      )}
      {importing && info && (!info.encrypted || ready) && (
        <div className="warn">
          <h3>¿Reemplazar tus datos actuales?</h3>
          <p><b>{info.docs} elementos</b> · copia del {new Date(info.exportedAt).toLocaleString('es-ES')}{info.encrypted ? ' · cifrada' : ''}</p>
          <p className="small">Los datos actuales se sustituirán. Si quieres conservarlos, exporta antes una copia.</p>
          <div className="row-end"><button className="tool" onClick={() => { setInfo(null); setReady(false); }}>Cancelar</button><button className="danger" disabled={busy === 'import'} onClick={() => void importNow()}>{busy === 'import' ? 'Importando…' : 'Reemplazar e importar'}</button></div>
        </div>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );
}

function RemindSettings() {
  const { state, dispatch, toast } = useApp();
  const s = state.settings;
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => { void notificationsAllowed(false).then(setAllowed); }, []);
  return (
    <div className="stack">
      <div className="srow">
        <div><h3>Notificaciones del sistema</h3><p className="muted">Un aviso en pantalla a la hora del recordatorio, mientras la app esté abierta.</p>
          {allowed === false && s.notify && <p className="small err">El sistema no ha dado permiso todavía.</p>}</div>
        <Switch on={s.notify} label="Notificaciones del sistema" onChange={async (on) => { dispatch({ t: 'settings', patch: { notify: on } }); if (on) setAllowed(await notificationsAllowed(true)); }} />
      </div>
      <div className="srow">
        <div><h3>Sonido</h3><p className="muted">Un sonido suave junto al aviso.</p></div>
        <div className="row"><button className="tool small-btn" onClick={() => playChime()}>Probar</button><Switch on={s.sound} label="Sonido" onChange={(v) => dispatch({ t: 'settings', patch: { sound: v } })} /></div>
      </div>
      <div className="srow">
        <div><h3>Avisar</h3><p className="muted">Cuánto antes de la hora llega el aviso.</p></div>
        <select value={s.leadMin} aria-label="Avisar" onChange={(e) => dispatch({ t: 'settings', patch: { leadMin: Number(e.target.value) as 0 | 5 | 15 | 60 } })}>
          <option value={0}>A la hora</option><option value={5}>5 min antes</option><option value={15}>15 min antes</option><option value={60}>1 h antes</option>
        </select>
      </div>
      <div className="srow">
        <div><h3>Al abrir la app</h3><p className="muted">Mostrar los recordatorios que pasaron mientras estaba cerrada.</p></div>
        <Switch on={s.showMissed} label="Al abrir la app" onChange={(v) => dispatch({ t: 'settings', patch: { showMissed: v } })} />
      </div>
      <div className="srow">
        <div><h3>Probar aviso</h3><p className="muted">Envía un aviso de prueba ahora.</p></div>
        <button className="tool" onClick={async () => { if (await notificationsAllowed(true)) { await notify('Cuaderno', 'Así se verán tus recordatorios.'); if (s.sound) playChime(); setAllowed(true); } else toast('El sistema no permite avisos: actívalos en los ajustes de tu sistema.'); }}>Enviar aviso</button>
      </div>
    </div>
  );
}
