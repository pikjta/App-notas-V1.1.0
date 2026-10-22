// Paneles de personalización: tipografía (nombre de la sesión y título del tablero),
// barra lateral y tablero (ambientes, colores y texturas).
import { useState } from 'react';
import { useApp } from '../App';
import { AMBIENTS, AMBIENT_IDS, BOARD_COLORS, BOARD_COLOR_IDS, CARD_THEMES, CARD_THEME_IDS, DEFAULT_SESSION_FONT, DEFAULT_SIDE, DEFAULT_THEME, DEFAULT_TITLE_FONT, FONTS, FONT_COLORS, FONT_IDS, SIDE_COLORS, SIDE_COLOR_IDS, TEXTURES, TEXTURE_IDS, WEIGHT_LABEL } from '../lib/appearance';
import type { FontStyle, FontWeight, FontSize, Texture, Theme } from '../lib/appearance';
import type { Project } from '../lib/model';
import { DEFAULT_CALLOOK } from '../lib/model';
import { COLOR_ICONS, DEFAULT_COLOR_ICON, DEFAULT_ICON_STYLE, ICON_STYLES, normalizeColorIcon, normalizeIconStyle } from '../lib/icons';
import { Icon } from './Icon';

const SWATCH_BG: Record<string, string> = Object.fromEntries(FONT_COLORS.filter((c) => c.id && c.id !== 'task').map((c) => [c.id!, c.id!]));

function Seg<T extends string>({ value, options, label, onChange }: { value: T; options: { id: T; name: string }[]; label: string; onChange: (v: T) => void }) {
  return (
    <div className="ap-field">
      <span className="menu-label">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => <button key={o.id} className={value === o.id ? 'on' : ''} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.name}</button>)}
      </div>
    </div>
  );
}

function Panel({ title, scope, onClose, children, foot }: { title: string; scope: string; onClose: () => void; children: React.ReactNode; foot?: React.ReactNode }) {
  return (
    <div className="ap-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="ap-panel" role="dialog" aria-label={title} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <header className="ap-head"><h2>{title}</h2><span className="ap-scope">{scope}</span></header>
        <div className="ap-body">{children}</div>
        <footer className="ap-foot">{foot}<span className="grow" /><button className="primary" onClick={onClose}>Listo</button></footer>
      </section>
    </div>
  );
}

/** Tipografía: 12 fuentes, tamaño, grosor, estilo y color. */
export function FontPanel({ kind, font, taskColor, onChange, onClose }: { kind: 'session' | 'title'; font: FontStyle; taskColor?: string; onChange: (f: FontStyle) => void; onClose: () => void }) {
  const sizes: { id: FontSize; name: string }[] = kind === 'title' ? [{ id: 'S', name: 'S' }, { id: 'M', name: 'M' }, { id: 'L', name: 'L' }, { id: 'XL', name: 'XL' }] : [{ id: 'S', name: 'S' }, { id: 'M', name: 'M' }, { id: 'L', name: 'L' }];
  const base = kind === 'title' ? DEFAULT_TITLE_FONT : DEFAULT_SESSION_FONT;
  const set = (patch: Partial<FontStyle>) => onChange({ ...font, ...patch });
  return (
    <Panel title={kind === 'title' ? 'Fuente del título' : 'Fuente del nombre'} scope={kind === 'title' ? 'Solo esta tarea principal' : 'Toda la app'} onClose={onClose} foot={<button className="tool" onClick={() => onChange(base)}>Restablecer</button>}>
      <div className="ap-field">
        <span className="menu-label">Fuente</span>
        <div className="font-grid">
          {FONT_IDS.map((k) => (
            <button key={k} className={'font-btn' + (font.family === k ? ' on' : '')} aria-pressed={font.family === k} onClick={() => set({ family: k })}>
              <span className="font-aa" style={{ fontFamily: FONTS[k].stack }}>Aa</span><span>{FONTS[k].name}</span>
            </button>
          ))}
        </div>
      </div>
      <Seg<FontSize> label="Tamaño" value={font.size} options={sizes} onChange={(size) => set({ size })} />
      <Seg<FontWeight> label="Grosor" value={font.weight} options={(Object.keys(WEIGHT_LABEL) as FontWeight[]).map((id) => ({ id, name: WEIGHT_LABEL[id] }))} onChange={(weight) => set({ weight })} />
      <Seg<'n' | 'i'> label="Estilo" value={font.italic ? 'i' : 'n'} options={[{ id: 'n', name: 'Recta' }, { id: 'i', name: 'Cursiva' }]} onChange={(v) => set({ italic: v === 'i' })} />
      <div className="ap-field">
        <span className="menu-label">Color</span>
        <div className="swatch-row">
          {FONT_COLORS.filter((c) => kind === 'title' || c.id !== 'task').map((c) => {
            const bg = c.id === null ? 'conic-gradient(#24211e 0 50%, #f4efe4 50% 100%)' : c.id === 'task' ? (taskColor ?? '#888') : SWATCH_BG[c.id];
            const label = c.id === null ? (kind === 'title' ? 'Tinta (según el fondo)' : 'Tinta (según la barra)') : c.name;
            return <button key={String(c.id)} className={'swatch' + (font.color === c.id ? ' on' : '')} title={label} aria-label={label} style={{ background: bg }} onClick={() => set({ color: c.id })} />;
          })}
        </div>
      </div>
      <p className="ap-preview" style={{ fontFamily: FONTS[font.family].stack, fontWeight: font.weight === 'normal' ? 400 : font.weight === 'semi' ? 600 : 800, fontStyle: font.italic ? 'italic' : 'normal', color: font.color === 'task' ? taskColor : font.color ?? undefined }}>Cuaderno</p>
    </Panel>
  );
}

/** Personalizar barra: color y textura (iguales en todos los tableros). */
export function SidePanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const side = state.settings.side;
  const iconStyle = normalizeIconStyle(state.settings.iconStyle);
  const colorIcon = normalizeColorIcon(state.settings.colorIcon);
  const set = (patch: Partial<typeof side>) => dispatch({ t: 'settings', patch: { side: { ...side, ...patch } } });
  return (
    <Panel title="Personalizar barra" scope="Toda la app" onClose={onClose} foot={<button className="tool" onClick={() => dispatch({ t: 'settings', patch: { side: DEFAULT_SIDE, iconStyle: DEFAULT_ICON_STYLE, colorIcon: DEFAULT_COLOR_ICON } })}>Restablecer</button>}>
      <div className="ap-field">
        <span className="menu-label">Color · {SIDE_COLORS[side.color].name}</span>
        <div className="swatch-row">{SIDE_COLOR_IDS.map((k) => <button key={k} className={'swatch' + (side.color === k ? ' on' : '')} title={SIDE_COLORS[k].name} aria-label={SIDE_COLORS[k].name} style={{ background: SIDE_COLORS[k].bg }} onClick={() => set({ color: k })} />)}</div>
      </div>
      <TextureField label={'Textura · ' + TEXTURES[side.texture]} value={side.texture} onChange={(texture) => set({ texture })} />
      <div className="ap-field">
        <span className="menu-label">Estilo de los iconos · {ICON_STYLES.find((x) => x.id === iconStyle)?.name}</span>
        <div className="icon-styles">
          {ICON_STYLES.map((x) => (
            <button key={x.id} className={'icon-style' + (iconStyle === x.id ? ' on' : '')} aria-pressed={iconStyle === x.id} title={x.name} aria-label={'Iconos ' + x.name} onClick={() => dispatch({ t: 'settings', patch: { iconStyle: x.id } })}>
              <span className="icon-style-sample">{['home', 'bell', 'calendar', 'palette'].map((k) => <Icon key={k} name={k} size={17} style={x.id} />)}</span>
              <span className="small">{x.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="ap-field">
        <span className="menu-label">Icono del botón de color · {COLOR_ICONS.find((x) => x.id === colorIcon)?.name}</span>
        <div className="swatch-row">
          {COLOR_ICONS.map((x) => (
            <button key={x.id} className={'icon-btn color-icon-opt' + (colorIcon === x.id ? ' on' : '')} aria-pressed={colorIcon === x.id} title={x.name} aria-label={'Icono de color: ' + x.name} onClick={() => dispatch({ t: 'settings', patch: { colorIcon: x.id } })}><Icon name={x.id} size={18} /></button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function TextureField({ label, value, onChange }: { label: string; value: Texture; onChange: (t: Texture) => void }) {
  return (
    <div className="ap-field">
      <span className="menu-label">{label}</span>
      <div className="tex-grid">{TEXTURE_IDS.map((k) => <button key={k} className={'tex-chip tex-' + k + (value === k ? ' on' : '')} aria-pressed={value === k} onClick={() => onChange(k)}>{TEXTURES[k]}</button>)}</div>
    </div>
  );
}

/** Personalizar tablero: ambientes y, en dos pestañas, colores y texturas del tablero y de las tarjetas. */
export function BoardPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const { dispatch, toast } = useApp();
  const [tab, setTab] = useState<'board' | 'cards'>('board');
  const theme: Theme = project.theme ?? DEFAULT_THEME;
  const set = (patch: Partial<Theme>) => dispatch({ t: 'setTheme', project: project.id, patch });
  return (
    <Panel title="Personalizar tablero" scope="Solo esta tarea principal" onClose={onClose}
      foot={<>
        <button className="tool" onClick={() => dispatch({ t: 'applyThemeAll', theme })}>Aplicar a todas las tareas</button>
        <button className="tool" onClick={() => { set(DEFAULT_THEME); toast('Apariencia restablecida'); }}>Restablecer</button>
      </>}>
      <div className="ap-field">
        <span className="menu-label">Ambientes</span>
        <div className="amb-grid">
          {AMBIENT_IDS.map((k) => {
            const a = AMBIENTS[k]; const b = BOARD_COLORS[a.theme.board]; const c = CARD_THEMES[a.theme.card];
            return (
              <button key={k} className="amb" aria-label={a.name} onClick={() => set(a.theme)}>
                <span className={'amb-board tex-' + a.theme.texture} style={{ background: b.bg, ['--board-ink' as string]: b.ink }}><i style={{ background: c.bg }} /><i style={{ background: c.bg }} /></span>
                <span>{a.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="tabs ap-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'board'} className={tab === 'board' ? 'on' : ''} onClick={() => setTab('board')}>Tablero</button>
        <button role="tab" aria-selected={tab === 'cards'} className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>Tarjetas</button>
      </div>
      {tab === 'board' ? (
        <>
          <div className="ap-field">
            <span className="menu-label">Color · {BOARD_COLORS[theme.board].name}</span>
            <div className="swatch-row">{BOARD_COLOR_IDS.map((k) => <button key={k} className={'swatch' + (theme.board === k ? ' on' : '')} title={BOARD_COLORS[k].name} aria-label={BOARD_COLORS[k].name} style={{ background: BOARD_COLORS[k].bg }} onClick={() => set({ board: k })} />)}</div>
          </div>
          <TextureField label={'Textura · ' + TEXTURES[theme.texture]} value={theme.texture} onChange={(texture) => set({ texture })} />
        </>
      ) : (
        <>
          <div className="ap-field">
            <span className="menu-label">Color · {CARD_THEMES[theme.card].name}</span>
            <div className="swatch-row">{CARD_THEME_IDS.map((k) => <button key={k} className={'swatch' + (theme.card === k ? ' on' : '')} title={CARD_THEMES[k].name} aria-label={CARD_THEMES[k].name} style={{ background: CARD_THEMES[k].bg }} onClick={() => set({ card: k })} />)}</div>
          </div>
          <TextureField label={'Textura · ' + TEXTURES[theme.cardTexture]} value={theme.cardTexture} onChange={(cardTexture) => set({ cardTexture })} />
        </>
      )}
    </Panel>
  );
}

/** Apariencia del calendario: barra lateral, fondo y celdas (solo afecta al calendario). */
export function CalendarPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<'side' | 'bg' | 'cell'>('side');
  const look = state.settings.calLook;
  const set = (patch: Partial<typeof look>) => dispatch({ t: 'settings', patch: { calLook: { ...look, ...patch } } });
  return (
    <Panel title="Apariencia del calendario" scope="Solo el calendario" onClose={onClose} foot={<button className="tool" onClick={() => dispatch({ t: 'settings', patch: { calLook: DEFAULT_CALLOOK } })}>Restablecer</button>}>
      <div className="seg" role="tablist">
        {([['side', 'Barra lateral'], ['bg', 'Fondo'], ['cell', 'Celdas']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'side' && <>
        <div className="ap-field"><span className="menu-label">Color · {SIDE_COLORS[look.side.color].name}</span>
          <div className="swatch-row">{SIDE_COLOR_IDS.map((k) => <button key={k} className={'swatch' + (look.side.color === k ? ' on' : '')} title={SIDE_COLORS[k].name} aria-label={SIDE_COLORS[k].name} style={{ background: SIDE_COLORS[k].bg }} onClick={() => set({ side: { ...look.side, color: k } })} />)}</div></div>
        <TextureField label={'Textura · ' + TEXTURES[look.side.texture]} value={look.side.texture} onChange={(texture) => set({ side: { ...look.side, texture } })} />
      </>}
      {tab === 'bg' && <>
        <div className="ap-field"><span className="menu-label">Color · {BOARD_COLORS[look.bg.color].name}</span>
          <div className="swatch-row">{BOARD_COLOR_IDS.map((k) => <button key={k} className={'swatch' + (look.bg.color === k ? ' on' : '')} title={BOARD_COLORS[k].name} aria-label={BOARD_COLORS[k].name} style={{ background: BOARD_COLORS[k].bg }} onClick={() => set({ bg: { ...look.bg, color: k } })} />)}</div></div>
        <TextureField label={'Textura · ' + TEXTURES[look.bg.texture]} value={look.bg.texture} onChange={(texture) => set({ bg: { ...look.bg, texture } })} />
      </>}
      {tab === 'cell' && <>
        <div className="ap-field"><span className="menu-label">Color · {CARD_THEMES[look.cell.color].name}</span>
          <div className="swatch-row">{CARD_THEME_IDS.map((k) => <button key={k} className={'swatch' + (look.cell.color === k ? ' on' : '')} title={CARD_THEMES[k].name} aria-label={CARD_THEMES[k].name} style={{ background: CARD_THEMES[k].bg }} onClick={() => set({ cell: { ...look.cell, color: k } })} />)}</div></div>
        <TextureField label={'Textura · ' + TEXTURES[look.cell.texture]} value={look.cell.texture} onChange={(texture) => set({ cell: { ...look.cell, texture } })} />
      </>}
    </Panel>
  );
}
