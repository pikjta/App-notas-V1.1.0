import { describe, expect, it } from 'vitest';
import { checklistToMarkdown, looksLikeList, parseChecklist } from '../checklist';

let n = 0;
const id = () => 'i' + n++;

describe('checklist: copiar y pegar', () => {
  it('exporta Markdown con sangría para las subtareas', () => {
    const md = checklistToMarkdown([
      { id: 'a', text: 'Bocetos', done: false, level: 0 },
      { id: 'b', text: 'Logo', done: true, level: 1 },
    ]);
    expect(md).toBe('- [ ] Bocetos\n  - [x] Logo');
  });
  it('lee Markdown, viñetas, números y líneas sueltas', () => {
    const l = parseChecklist('- [x] Uno\n  - [ ] Dos\n3. Tres\n\nCuatro\n\t- Cinco', id);
    expect(l.map((i) => [i.text, i.done, i.level])).toEqual([['Uno', true, 0], ['Dos', false, 1], ['Tres', false, 0], ['Cuatro', false, 0], ['Cinco', false, 1]]);
  });
  it('una sangría sin tarea principal antes no crea una subtarea', () => {
    expect(parseChecklist('  - Solo', id)[0].level).toBe(0);
  });
  it('detecta listas pegadas', () => {
    expect(looksLikeList('hola')).toBe(false);
    expect(looksLikeList('a\nb')).toBe(true);
    expect(looksLikeList('- [ ] a')).toBe(true);
  });
});
