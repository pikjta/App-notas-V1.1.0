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
