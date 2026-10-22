// Apariencia: ambientes, colores y texturas del tablero y de las tarjetas, colores de la barra
// lateral, tipografías y colores de tarjeta. Funciones y datos puros (sin React).

// ---------------------------------------------------------------------------------------------
// Color

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(f.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Luminosidad relativa (0 = negro, 1 = blanco). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const isDark = (hex: string): boolean => luminance(hex) < 0.18; // 0,18: por debajo, el texto claro contrasta más que el oscuro

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a); const [r2, g2, b2] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return '#' + m(r1, r2) + m(g1, g2) + m(b1, b2);
}

// ---------------------------------------------------------------------------------------------
// Texturas (iguales para tablero y tarjetas)

export type Texture = 'liso' | 'puntos' | 'cuadricula' | 'cuaderno' | 'lienzo' | 'diagonal' | 'acuarela';
export const TEXTURES: Record<Texture, string> = {
  liso: 'Liso', puntos: 'Puntos', cuadricula: 'Cuadrícula', cuaderno: 'Cuaderno', lienzo: 'Lienzo', diagonal: 'Diagonal', acuarela: 'Acuarela',
};
export const TEXTURE_IDS = Object.keys(TEXTURES) as Texture[];
/** Textura guardada por versiones anteriores → la equivalente de ahora. */
const OLD_TEXTURE: Record<string, Texture> = { rayas: 'cuaderno' };
export const normalizeTexture = (t: unknown): Texture => (typeof t === 'string' && t in TEXTURES ? (t as Texture) : OLD_TEXTURE[String(t)] ?? 'liso');

// ---------------------------------------------------------------------------------------------
// Tablero y tarjetas

export type BoardColor = 'papel' | 'hueso' | 'arena' | 'niebla' | 'lavanda' | 'noche' | 'abismo';
type Palette = { name: string; bg: string; ink: string; muted: string; line: string; dark: boolean };
const pal = (name: string, bg: string, ink: string): Palette => {
  const dark = isDark(bg);
  return { name, bg, ink, muted: mix(bg, ink, 0.62), line: mix(bg, ink, dark ? 0.2 : 0.12), dark };
};
export const BOARD_COLORS: Record<BoardColor, Palette> = {
  papel: pal('Papel', '#ECE6DA', '#24211E'),
  hueso: pal('Blanco roto', '#F6F3EC', '#24211E'),
  arena: pal('Arena', '#F1E3CC', '#2B2219'),
  niebla: pal('Niebla', '#DDE3E6', '#1F272B'),
  lavanda: pal('Lavanda', '#E4DEEE', '#262033'),
  noche: pal('Noche', '#1E1B26', '#F1EEF6'),
  abismo: pal('Abismo', '#0F1B2A', '#E8EEF5'),
};
export const BOARD_COLOR_IDS = Object.keys(BOARD_COLORS) as BoardColor[];
const OLD_BOARD: Record<string, BoardColor> = { lino: 'hueso', salvia: 'niebla', pizarra: 'abismo' };
export const normalizeBoardColor = (c: unknown): BoardColor => (typeof c === 'string' && c in BOARD_COLORS ? (c as BoardColor) : OLD_BOARD[String(c)] ?? 'papel');

export type CardTheme = 'papel' | 'blanco' | 'crema' | 'menta' | 'cielo' | 'grafito' | 'marino';
export const CARD_THEMES: Record<CardTheme, { name: string; bg: string; ink: string; dark: boolean }> = {
  papel: { name: 'Papel', bg: '#FFFDF8', ink: '#1F1D1A', dark: false },
  blanco: { name: 'Blanco', bg: '#FFFFFF', ink: '#1F1D1A', dark: false },
  crema: { name: 'Crema', bg: '#FBF1DC', ink: '#2B2219', dark: false },
  menta: { name: 'Menta', bg: '#E1F1E8', ink: '#16291F', dark: false },
  cielo: { name: 'Cielo', bg: '#E1EEF8', ink: '#142536', dark: false },
  grafito: { name: 'Grafito', bg: '#2A2D31', ink: '#EEF0F2', dark: true },
  marino: { name: 'Marino', bg: '#1B2A44', ink: '#E8EEF8', dark: true },
};
export const CARD_THEME_IDS = Object.keys(CARD_THEMES) as CardTheme[];
export const normalizeCardTheme = (c: unknown): CardTheme => (typeof c === 'string' && c in CARD_THEMES ? (c as CardTheme) : 'papel');

/** Apariencia del tablero de una tarea principal. */
export type Theme = { board: BoardColor; texture: Texture; card: CardTheme; cardTexture: Texture };
export const DEFAULT_THEME: Theme = { board: 'papel', texture: 'puntos', card: 'papel', cardTexture: 'liso' };
export const normalizeTheme = (t: Partial<Record<keyof Theme, unknown>> | undefined | null): Theme => ({
  board: normalizeBoardColor(t?.board), texture: t?.texture === undefined ? DEFAULT_THEME.texture : normalizeTexture(t.texture),
  card: normalizeCardTheme(t?.card), cardTexture: normalizeTexture(t?.cardTexture),
});

/** Ambientes: combinaciones listas de color y textura de tablero y tarjetas. */
export type Ambient = 'estudio' | 'cuaderno' | 'acuarela' | 'risografia' | 'noche' | 'taller';
export const AMBIENTS: Record<Ambient, { name: string; theme: Theme }> = {
  estudio: { name: 'Estudio', theme: { board: 'papel', texture: 'puntos', card: 'papel', cardTexture: 'liso' } },
  cuaderno: { name: 'Cuaderno', theme: { board: 'hueso', texture: 'cuaderno', card: 'blanco', cardTexture: 'cuaderno' } },
  acuarela: { name: 'Acuarela', theme: { board: 'niebla', texture: 'acuarela', card: 'cielo', cardTexture: 'acuarela' } },
  risografia: { name: 'Risografía', theme: { board: 'lavanda', texture: 'diagonal', card: 'crema', cardTexture: 'puntos' } },
  noche: { name: 'Noche', theme: { board: 'noche', texture: 'puntos', card: 'grafito', cardTexture: 'liso' } },
  taller: { name: 'Taller', theme: { board: 'arena', texture: 'lienzo', card: 'crema', cardTexture: 'lienzo' } },
};
export const AMBIENT_IDS = Object.keys(AMBIENTS) as Ambient[];

// ---------------------------------------------------------------------------------------------
// Color propio de cada tarjeta

export type CardColor = { id: string | null; name: string; bg: string; tag?: boolean };
export const CARD_COLORS: CardColor[] = [
  { id: null, name: 'Automático (según el tablero)', bg: '#FFFDF8' },
  { id: '#FFF3C4', name: 'Mantequilla', bg: '#FFF3C4' },
  { id: '#FDE2CF', name: 'Melocotón', bg: '#FDE2CF' },
  { id: '#F8D9E2', name: 'Rosa', bg: '#F8D9E2' },
  { id: '#E6DDF6', name: 'Lila', bg: '#E6DDF6' },
  { id: '#D9E8F6', name: 'Cielo', bg: '#D9E8F6' },
  { id: '#D6EEE2', name: 'Menta', bg: '#D6EEE2' },
  { id: '#F4EFE4', name: 'Papel', bg: '#F4EFE4' },
  { id: '#2B2926', name: 'Tinta', bg: '#2B2926' },
  { id: '#1F3A2E', name: 'Bosque', bg: '#1F3A2E' },
  { id: '#C9B6E4', name: 'Ilustración', bg: '#C9B6E4', tag: true },
  { id: '#F2B6A0', name: 'Pintura', bg: '#F2B6A0', tag: true },
  { id: '#A9D3C2', name: 'Cliente', bg: '#A9D3C2', tag: true },
  { id: '#F08A7C', name: 'Urgente', bg: '#F08A7C', tag: true },
  { id: '#9CC3EA', name: 'Digital', bg: '#9CC3EA', tag: true },
];

/** Contraste WCAG entre dos colores (1–21). */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Texto legible sobre un fondo cualquiera (también los elegidos con el selector libre): el claro o el oscuro del tema si llegan a 4,5 : 1 y, si no, negro o blanco. */
export function inkFor(bg: string): string {
  const light = '#F2EEE6', dark = '#1F1D1A';
  const best = contrast(bg, light) >= contrast(bg, dark) ? light : dark;
  if (contrast(bg, best) >= 4.5) return best;
  return contrast(bg, '#FFFFFF') >= contrast(bg, '#000000') ? '#FFFFFF' : '#000000';
}

/** Variables de color de una tarjeta: su color propio (o el del tablero) y un texto legible encima. */
export function cardVars(color: string | null, theme: Theme): Record<string, string> {
  const base = CARD_THEMES[theme.card];
  const bg = color ?? base.bg;
  const ink = color ? inkFor(bg) : base.ink;
  const dark = isDark(bg);
  return {
    ['--card-bg']: bg, ['--card-ink']: ink, ['--card-muted']: mix(bg, ink, 0.62),
    ['--card-line']: mix(bg, ink, dark ? 0.22 : 0.12), ['--card-soft']: mix(bg, ink, dark ? 0.12 : 0.05),
  };
}

// ---------------------------------------------------------------------------------------------
// Barra lateral

export type SideColor = 'papel' | 'salvia' | 'arcilla' | 'ocre' | 'tinta' | 'cobalto' | 'bosque';
export const SIDE_COLORS: Record<SideColor, { name: string; bg: string }> = {
  papel: { name: 'Papel', bg: '#E8E1D3' },
  salvia: { name: 'Salvia', bg: '#C9D4C3' },
  arcilla: { name: 'Rosa arcilla', bg: '#DDB9AB' },
  ocre: { name: 'Ocre', bg: '#D9B25F' },
  tinta: { name: 'Tinta', bg: '#24211E' },
  cobalto: { name: 'Cobalto', bg: '#1F3F7A' },
  bosque: { name: 'Bosque', bg: '#1F3A2E' },
};
export const SIDE_COLOR_IDS = Object.keys(SIDE_COLORS) as SideColor[];
export type SideStyle = { color: SideColor; texture: Texture };
export const DEFAULT_SIDE: SideStyle = { color: 'tinta', texture: 'liso' };
export const normalizeSide = (s: Partial<SideStyle> | undefined): SideStyle => ({
  color: s?.color && s.color in SIDE_COLORS ? s.color : DEFAULT_SIDE.color, texture: normalizeTexture(s?.texture ?? 'liso'),
});
export function sideVars(s: SideStyle): Record<string, string> {
  const bg = SIDE_COLORS[s.color].bg;
  const ink = isDark(bg) ? '#F3EEE6' : '#24211E';
  return { ['--side-bg']: bg, ['--side-ink']: ink, ['--side-muted']: mix(bg, ink, 0.6), ['--side-line']: mix(bg, ink, 0.18), ['--side-soft']: mix(bg, ink, 0.1) };
}

// ---------------------------------------------------------------------------------------------
// Tipografías (nombre de la sesión y título de cada tablero)

export type FontFamily = 'clasica' | 'elegante' | 'moderna' | 'geometrica' | 'manuscrita' | 'maquina' | 'editorial' | 'libro' | 'artistica' | 'titular' | 'cartel' | 'rotulador';
// Pilas de fuentes del sistema: la app no carga nada de internet.
export const FONTS: Record<FontFamily, { name: string; stack: string }> = {
  clasica: { name: 'Clásica', stack: "'Fraunces Variable', Georgia, 'Times New Roman', serif" },
  elegante: { name: 'Elegante', stack: "'Didot', 'Bodoni MT', 'Playfair Display', 'Palatino Linotype', serif" },
  moderna: { name: 'Moderna', stack: "'Manrope Variable', 'Segoe UI', system-ui, sans-serif" },
  geometrica: { name: 'Geométrica', stack: "'Century Gothic', 'Avenir Next', Futura, 'Trebuchet MS', sans-serif" },
  manuscrita: { name: 'Manuscrita', stack: "'Segoe Script', 'Bradley Hand', 'Brush Script MT', 'Comic Sans MS', cursive" },
  maquina: { name: 'Máquina', stack: "'Courier New', 'American Typewriter', Courier, monospace" },
  editorial: { name: 'Editorial', stack: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif" },
  libro: { name: 'Libro', stack: "Charter, 'Bitstream Charter', Cambria, 'Iowan Old Style', serif" },
  artistica: { name: 'Artística', stack: "'Gabriola', 'Papyrus', 'Apple Chancery', 'Lucida Calligraphy', fantasy" },
  titular: { name: 'Titular', stack: "'Arial Black', 'Helvetica Neue', Impact, sans-serif" },
  cartel: { name: 'Cartel', stack: "Impact, 'Haettenschweiler', 'Arial Narrow Bold', sans-serif" },
  rotulador: { name: 'Rotulador', stack: "'Marker Felt', 'Segoe Print', 'Comic Sans MS', cursive" },
};
export const FONT_IDS = Object.keys(FONTS) as FontFamily[];

export type FontSize = 'S' | 'M' | 'L' | 'XL';
export type FontWeight = 'normal' | 'semi' | 'bold';
/** `color`: null = tinta automática (según la barra o el fondo); «task» = color de la tarea principal; si no, un hex. */
export type FontStyle = { family: FontFamily; size: FontSize; weight: FontWeight; italic: boolean; color: string | null };
export const DEFAULT_SESSION_FONT: FontStyle = { family: 'clasica', size: 'M', weight: 'semi', italic: false, color: null };
export const DEFAULT_TITLE_FONT: FontStyle = { family: 'clasica', size: 'L', weight: 'semi', italic: false, color: null };
const WEIGHT: Record<FontWeight, number> = { normal: 400, semi: 600, bold: 800 };
export const SIZE_PX: Record<'session' | 'title', Record<FontSize, number>> = {
  session: { S: 20, M: 26, L: 32, XL: 38 },
  title: { S: 30, M: 38, L: 44, XL: 58 },
};
export const WEIGHT_LABEL: Record<FontWeight, string> = { normal: 'Normal', semi: 'Semi', bold: 'Negrita' };
export const FONT_COLORS: { id: string | null; name: string }[] = [
  { id: null, name: 'Tinta' }, { id: 'task', name: 'Color de la tarea' },
  { id: '#2A2724', name: 'Carbón' }, { id: '#F4EFE4', name: 'Hueso' }, { id: '#C2603E', name: 'Terracota' }, { id: '#D8412F', name: 'Bermellón' },
  { id: '#C2287A', name: 'Magenta' }, { id: '#6E2F5F', name: 'Ciruela' }, { id: '#3B3F9E', name: 'Índigo' }, { id: '#2458B8', name: 'Cobalto' },
  { id: '#17908A', name: 'Turquesa' }, { id: '#6B7A2A', name: 'Oliva' }, { id: '#C99A2E', name: 'Ocre' }, { id: '#8C857A', name: 'Piedra' },
];
export const normalizeFont = (f: Partial<FontStyle> | undefined, base: FontStyle): FontStyle => ({
  family: f?.family && f.family in FONTS ? f.family : base.family,
  size: f?.size && ['S', 'M', 'L', 'XL'].includes(f.size) ? f.size : base.size,
  weight: f?.weight && f.weight in WEIGHT ? f.weight : base.weight,
  italic: typeof f?.italic === 'boolean' ? f.italic : base.italic,
  color: f?.color === undefined ? base.color : f.color,
});

/** Estilos CSS de una tipografía. `taskColor` es el color de la tarea principal. */
export function fontCss(f: FontStyle, kind: 'session' | 'title', taskColor?: string): Record<string, string | number> {
  const color = f.color === 'task' ? taskColor : f.color ?? undefined;
  const css: Record<string, string | number> = { fontFamily: FONTS[f.family].stack, fontSize: SIZE_PX[kind][f.size], fontWeight: WEIGHT[f.weight], fontStyle: f.italic ? 'italic' : 'normal' };
  if (color) css.color = color;
  return css;
}

// ---------------------------------------------------------------------------------------------
// Cuadrícula del imán

export const GRID_SIZES: { value: 16 | 24 | 32; name: string }[] = [{ value: 16, name: 'Fina' }, { value: 24, name: 'Media' }, { value: 32, name: 'Amplia' }];
