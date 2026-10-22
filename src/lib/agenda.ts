// Lógica de agenda (pura): recordatorios, la vista Hoy, avisos, widgets y fechas del Diario.
import type { Card, CheckCard, Project, ReminderCard } from './model';
import { progress } from './pm';
import type { State } from './store';

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromDayKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Mueve una fecha «AAAA-MM-DD» `n` días (cruza meses y años). */
export const shiftDay = (k: string, n: number) => { const d = fromDayKey(k); d.setDate(d.getDate() + n); return dayKey(d); };

const DOW = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** «lunes 28 de septiembre de 2026» */
export const longDate = (k: string) => { const d = fromDayKey(k); return `${DOW[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`; };
export const monthName = (m: number) => MONTHS[m];

export type ReminderItem = { card: ReminderCard; project: Project; at: Date | null };

/** Recordatorios vivos (fuera de la papelera y de tareas principales vivas), por fecha; los sin fecha al final. */
export function reminders(s: State): ReminderItem[] {
  const live = new Map(s.projects.filter((p) => !p.trashed).map((p) => [p.id, p]));
  const out: ReminderItem[] = [];
  for (const c of s.cards) {
    if (c.type !== 'reminder' || c.trashed) continue;
    const project = live.get(c.project);
    if (!project) continue;
    const d = c.when ? new Date(c.when) : null;
    out.push({ card: c, project, at: d && !isNaN(d.getTime()) ? d : null });
  }
  return out.sort((a, b) => (a.at?.getTime() ?? Infinity) - (b.at?.getTime() ?? Infinity));
}

export type ReminderGroup = { key: 'late' | 'today' | 'week' | 'later' | 'none' | 'done'; label: string; items: ReminderItem[] };

/** Agrupa en Atrasados, Hoy, Próximos 7 días, Más adelante, Sin fecha y Hechos (solo los grupos con algo). */
export function groupReminders(items: ReminderItem[], now: Date = new Date()): ReminderGroup[] {
  const t = now.getTime();
  const today = startOfDay(now);
  const days = (d: Date) => Math.round((startOfDay(d) - today) / DAY);
  const open = items.filter((i) => !i.card.done);
  const groups: ReminderGroup[] = [
    { key: 'late', label: 'Atrasados', items: open.filter((i) => i.at && i.at.getTime() < t) },
    { key: 'today', label: 'Hoy', items: open.filter((i) => i.at && i.at.getTime() >= t && days(i.at) === 0) },
    { key: 'week', label: 'Próximos 7 días', items: open.filter((i) => i.at && i.at.getTime() >= t && days(i.at) >= 1 && days(i.at) <= 7) },
    { key: 'later', label: 'Más adelante', items: open.filter((i) => i.at && i.at.getTime() >= t && days(i.at) > 7) },
    { key: 'none', label: 'Sin fecha', items: open.filter((i) => !i.at) },
    { key: 'done', label: 'Hechos', items: items.filter((i) => i.card.done) },
  ];
  return groups.filter((g) => g.items.length);
}

/** Texto corto: «Hoy 09:00», «Mañana 18:30», «Ayer 10:00», «hace 3 días», «jue, 1 oct · 09:00». */
export function whenLabel(at: Date | null, now: Date = new Date()): string {
  if (!at) return 'Sin fecha';
  const hm = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  const d = Math.round((startOfDay(at) - startOfDay(now)) / DAY);
  if (d === 0) return 'Hoy ' + hm;
  if (d === 1) return 'Mañana ' + hm;
  if (d === -1) return 'Ayer ' + hm;
  if (d < -1) return `Hace ${-d} días`;
  const sameYear = at.getFullYear() === now.getFullYear();
  return at.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }) + ' · ' + hm;
}

/**
 * Recordatorios a los que hay que avisar ahora: avisos activados en Ajustes, con campana, sin
 * hacer, sin aviso enviado para su hora actual (al cambiar la hora se vuelve a avisar), cuya
 * hora menos la antelación ya ha llegado, y de hace menos de un día (para no avisar en bloque
 * de cosas antiguas al abrir la app tras unos días).
 */
export function dueNotifications(s: State, now: Date = new Date(), leadMin: number = s.settings.leadMin ?? 0): ReminderItem[] {
  if (!s.settings.notify) return [];
  const t = now.getTime();
  return reminders(s).filter((i) => i.at && i.card.bell && !i.card.done && !i.card.notified && i.at.getTime() - leadMin * 60_000 <= t && t - i.at.getTime() < DAY);
}

export type ChecklistProgress = { card: CheckCard; project: Project; done: number; total: number };

/** Checklists empezadas y sin terminar (solo cuentan las tareas con texto). */
export function checklistsInProgress(s: State): ChecklistProgress[] {
  const live = new Map(s.projects.filter((p) => !p.trashed && !p.hidden).map((p) => [p.id, p]));
  const out: ChecklistProgress[] = [];
  for (const c of s.cards) {
    if (c.type !== 'check' || c.trashed || !live.has(c.project)) continue;
    const named = c.items.filter((it) => it.text.trim());
    const done = named.filter((it) => it.done).length;
    if (named.length && done < named.length) out.push({ card: c, project: live.get(c.project)!, done, total: named.length });
  }
  return out.sort((a, b) => b.done / b.total - a.done / a.total);
}

/** Progreso de una tarea principal: tareas de checklist hechas / totales. */
export function projectStats(cards: Card[], projectId: string): { done: number; total: number; pct: number } {
  let done = 0, total = 0;
  for (const c of cards) {
    if (c.project !== projectId || c.trashed) continue;
    if (c.type === 'check') for (const it of c.items) if (it.text.trim()) { total++; if (it.done) done++; }
    // Las filas de una Tabla PM cuentan como hechas al llegar al 100 %.
    if (c.type === 'pm') { const col = c.pm.cols.find((x) => x.type === 'progress'); if (col) for (const r of c.pm.rows) { total++; if (progress(c.pm, col, r) >= 100) done++; } }
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
