import type { CheckItem } from './model';

/** Lista completa como Markdown: «- [ ] tarea», con dos espacios de sangría para las subtareas. */
export function checklistToMarkdown(items: CheckItem[]): string {
  return items.map((it) => `${it.level === 1 ? '  ' : ''}- [${it.done ? 'x' : ' '}] ${it.text}`).join('\n');
}

/** ¿El texto pegado son varias líneas (o una línea con formato de lista)? */
export function looksLikeList(text: string): boolean {
  const t = text.replace(/\r/g, '').replace(/\n+$/, '');
  return t.includes('\n') || /^\s*(?:[-*+]\s+\[[ xX]\]\s|[-*+]\s)/.test(t);
}

/**
 * Convierte texto pegado en tareas. Acepta Markdown («- [x] tarea», «- tarea», «1. tarea») y
 * líneas sueltas; una línea con sangría (2 espacios o un tabulador) o dentro de una tarea es subtarea.
 */
export function parseChecklist(text: string, newId: () => string): CheckItem[] {
  const out: CheckItem[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    if (!raw.trim()) continue;
    const m = raw.match(/^(\s*)(?:[-*+]\s+\[([ xX])\]\s+|[-*+]\s+|\d+[.)]\s+)?(.*)$/);
    const indent = m ? m[1].replace(/\t/g, '  ').length : 0;
    const done = !!m && (m[2] === 'x' || m[2] === 'X');
    const body = (m ? m[3] : raw).trim();
    if (!body) continue;
    // Solo hay dos niveles: una sangría solo vale si ya hay una tarea principal antes.
    const level: 0 | 1 = indent >= 2 && out.length > 0 ? 1 : 0;
    out.push({ id: newId(), text: body, done, level });
  }
  return out;
}

/** Líneas visuales que ocupa un texto en un cuadro de texto (0 si no se puede medir, p. ej. sin diseño). */
export function visualLines(el: HTMLTextAreaElement): number {
  const lh = parseFloat(getComputedStyle(el).lineHeight);
  if (!lh || !el.scrollHeight) return 1;
  return Math.max(1, Math.round(el.scrollHeight / lh));
}

/** Línea visual (empezando en 0) en la que está el cursor, midiendo una copia invisible del cuadro. */
export function caretLine(el: HTMLTextAreaElement): number {
  const lh = parseFloat(getComputedStyle(el).lineHeight);
  if (!lh || !el.clientWidth) return 0;
  const cs = getComputedStyle(el);
  const mirror = document.createElement('div');
  for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const) mirror.style[k] = cs[k];
  mirror.style.cssText += ';position:absolute;visibility:hidden;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-all;top:0;left:-9999px;box-sizing:border-box;width:' + el.clientWidth + 'px';
  mirror.textContent = el.value.slice(0, el.selectionStart) + '​';
  document.body.appendChild(mirror);
  const line = Math.round(mirror.scrollHeight / lh) - 1;
  document.body.removeChild(mirror);
  return Math.max(0, line);
}
