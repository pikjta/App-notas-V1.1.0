import { ICON_DATA } from './iconData';

/** Estilos de iconos que se pueden elegir en «Personalizar barra». «notion» es el más parecido a los iconos de Notion. */
export type IconStyle = 'notion' | 'lineal' | 'grueso' | 'relleno' | 'duotono';
export const ICON_STYLES: { id: IconStyle; name: string }[] = [
  { id: 'notion', name: 'Notion' },
  { id: 'lineal', name: 'Lineal' },
  { id: 'grueso', name: 'Grueso' },
  { id: 'relleno', name: 'Relleno' },
  { id: 'duotono', name: 'Duotono' },
];
export const DEFAULT_ICON_STYLE: IconStyle = 'notion';

export type IconKey = string;
export const ICON_KEYS = Object.keys(ICON_DATA);
export const hasIcon = (k: unknown): k is IconKey => typeof k === 'string' && k in ICON_DATA;

/** Iconos posibles para el botón de color de las tarjetas (el primero es el predeterminado). */
export const COLOR_ICONS: { id: IconKey; name: string }[] = [
  { id: 'palette', name: 'Paleta' },
  { id: 'drop', name: 'Gota' },
  { id: 'bucket', name: 'Bote de pintura' },
  { id: 'swatches', name: 'Muestras' },
  { id: 'brush', name: 'Pincel' },
];
export const DEFAULT_COLOR_ICON: IconKey = 'palette';

export const normalizeIconStyle = (s: unknown): IconStyle => (ICON_STYLES.some((x) => x.id === s) ? (s as IconStyle) : DEFAULT_ICON_STYLE);
export const normalizeColorIcon = (k: unknown): IconKey => (COLOR_ICONS.some((x) => x.id === k) ? (k as IconKey) : DEFAULT_COLOR_ICON);

/** Contenido SVG de un icono en un estilo (cadena de confianza: viene de iconData.ts, no del usuario). */
export function iconMarkup(key: IconKey, style: IconStyle): string {
  const d = ICON_DATA[key] ?? ICON_DATA.folder;
  return d[style] ?? d.notion;
}

/** Nombre en español de cada icono (para elegirlo y para lectores de pantalla). */
export const ICON_LABELS: Record<string, string> = {
  home: 'Casa', sun: 'Sol', bell: 'Campana', calendar: 'Calendario', graph: 'Grafo', journal: 'Cuaderno', trash: 'Papelera',
  palette: 'Paleta', drop: 'Gota', bucket: 'Bote de pintura', swatches: 'Muestras', brush: 'Pincel', folder: 'Carpeta', star: 'Estrella',
  heart: 'Corazón', briefcase: 'Maletín', camera: 'Cámara', music: 'Música', book: 'Libro', image: 'Imagen', pencil: 'Lápiz',
  bulb: 'Bombilla', rocket: 'Cohete', globe: 'Mundo', flag: 'Bandera', target: 'Diana', cube: 'Cubo', code: 'Código', cart: 'Carrito',
  plane: 'Avión', car: 'Coche', coffee: 'Café', leaf: 'Hoja', flame: 'Llama', gift: 'Regalo', cap: 'Birrete', chart: 'Gráfico',
  clock: 'Reloj', pin: 'Chincheta', users: 'Personas', chat: 'Mensaje', mail: 'Correo', wrench: 'Llave', sparkle: 'Destellos',
  moon: 'Luna', cloud: 'Nube', bookmark: 'Marcador', check: 'Hecho', film: 'Película', scissors: 'Tijeras', megaphone: 'Megáfono',
  wallet: 'Cartera', house2: 'Edificios',
};
export const iconLabel = (k: IconKey): string => ICON_LABELS[k] ?? k;

/** Entradas de la barra lateral con icono configurable (Ajustes de «Personalizar barra»). */
export type ViewIconId = 'home' | 'today' | 'reminders' | 'calendar' | 'graph' | 'journal' | 'trash';
export const VIEW_ICONS: { id: ViewIconId; name: string; def: IconKey }[] = [
  { id: 'home', name: 'Inicio', def: 'home' },
  { id: 'today', name: 'Hoy', def: 'sun' },
  { id: 'reminders', name: 'Recordatorios', def: 'bell' },
  { id: 'calendar', name: 'Calendario', def: 'calendar' },
  { id: 'graph', name: 'Grafo', def: 'graph' },
  { id: 'journal', name: 'Diario', def: 'journal' },
  { id: 'trash', name: 'Papelera', def: 'trash' },
];
export type ViewIcons = Partial<Record<ViewIconId, IconKey>>;

/** Solo se guardan las entradas conocidas con un icono que exista; el resto usa el predeterminado. */
export function normalizeViewIcons(v: unknown): ViewIcons {
  const out: ViewIcons = {};
  if (v && typeof v === 'object') for (const e of VIEW_ICONS) { const k = (v as Record<string, unknown>)[e.id]; if (hasIcon(k) && k !== e.def) out[e.id] = k; }
  return out;
}
export const viewIconOf = (v: ViewIcons | undefined, id: ViewIconId): IconKey => {
  const k = v?.[id];
  return hasIcon(k) ? k : VIEW_ICONS.find((e) => e.id === id)!.def;
};
