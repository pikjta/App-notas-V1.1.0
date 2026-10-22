// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';

afterEach(cleanup);

const clip = (text = '') => {
  const store: Record<string, string> = { 'text/plain': text };
  return { getData: (k: string) => store[k] ?? '', setData: (k: string, v: string) => { store[k] = v; }, store };
};

describe('Mejoras 1.1.0', () => {
  it('la Papelera está justo debajo de Diario, en Vistas', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    const nav = screen.getByRole('navigation', { name: 'Vistas' });
    const names = [...nav.querySelectorAll('.side-name')].map((e) => e.textContent);
    expect(names.indexOf('Papelera')).toBe(names.indexOf('Diario') + 1);
  });

  it('Tabla PM: la vista previa muestra las 3 primeras columnas', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    await user.click(screen.getByText('+ Añadir tarjeta'));
    await user.click(screen.getByRole('menuitem', { name: 'Tabla PM' }));
    await user.click(screen.getByText('Proyecto con fases'));
    await user.keyboard('{Escape}');
    const card = document.querySelector('.pm-compact') as HTMLElement;
    expect(card).toBeTruthy();
    await user.click(screen.getByText('Abrir tabla'));
    await user.click(screen.getByText('+ Nueva fila'));
    await user.keyboard('Bocetos');
    await user.keyboard('{Escape}');
    const row = document.querySelector('.pm-mini-row') as HTMLElement;
    expect(row.querySelectorAll('.pm-mini-cell').length).toBe(3);
    expect(row.textContent).toContain('Bocetos');
  }, 30_000);

  it('Checklist: botón (+), sin botón inferior, flechas, Ctrl+A, copiar y pegar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    await user.click(screen.getByText('+ Tarea principal'));
    await user.type(screen.getByPlaceholderText('Nombre de la tarea principal'), 'Mural{Enter}');
    await user.click(screen.getByText('+ Añadir tarjeta'));
    await user.click(screen.getByRole('menuitem', { name: 'Checklist' }));
    expect(screen.queryByText('+ Añadir subtarea')).toBeNull();
    await user.type(screen.getByPlaceholderText('Escribe una tarea…'), 'Bocetos{Enter}Pintura');
    await user.click(screen.getAllByLabelText('Añadir subtarea')[0]);
    await user.keyboard('Logo');
    const boxes = () => screen.getAllByPlaceholderText('Escribe una tarea…') as HTMLTextAreaElement[];
    expect(boxes().map((b) => b.value)).toEqual(['Bocetos', 'Logo', 'Pintura']);
    // El texto largo es un cuadro de texto (se parte en líneas), no una sola línea.
    expect(boxes()[0].tagName).toBe('TEXTAREA');
    // Flechas.
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(boxes()[2]);
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(document.activeElement).toBe(boxes()[0]);
    // Ctrl+A selecciona toda la lista y Ctrl+C la copia como Markdown.
    await user.keyboard('{Control>}a{/Control}');
    const check = document.querySelector('.check') as HTMLElement;
    expect(check.className).toContain('all-selected');
    const cb = clip();
    fireEvent.copy(boxes()[0], { clipboardData: cb });
    expect(cb.store['text/plain']).toBe('- [ ] Bocetos\n  - [ ] Logo\n- [ ] Pintura');
    // Pegar con todo seleccionado reemplaza la lista.
    fireEvent.paste(boxes()[0], { clipboardData: clip('- [x] A\n  - [ ] B\n- [ ] C') });
    expect(boxes().map((b) => b.value)).toEqual(['A', 'B', 'C']);
    expect(check.className).not.toContain('all-selected');
  }, 30_000);
});

describe('Mejoras 1.1.0 · color e iconos', () => {
  it('el botón de color abre el selector libre y se elige un HEX', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    await user.click(screen.getByText('+ Añadir tarjeta'));
    await user.click(screen.getByRole('menuitem', { name: 'Nota' }));
    const btn = (() => { const l = screen.getAllByLabelText('Color de la tarjeta'); return l[l.length - 1]; })();
    const cardOf = () => btn.closest('.card') as HTMLElement;
    await user.click(btn);
    const dlg = screen.getByRole('dialog', { name: 'Color de la tarjeta' });
    // Ya no hay colores predefinidos ni etiquetas de color.
    expect(screen.queryByTitle('Mantequilla')).toBeNull();
    const hex = screen.getByLabelText('Código HEX') as HTMLInputElement;
    await user.clear(hex);
    await user.type(hex, 'd45a46');
    expect((screen.getByLabelText('Rojo') as HTMLInputElement).value).toBe('212');
    expect((screen.getByLabelText('Tono') as HTMLInputElement).value).toBe('8');
    await user.click(screen.getByText('Aceptar'));
    expect(screen.queryByRole('dialog', { name: 'Color de la tarjeta' })).toBeNull();
    expect(dlg.isConnected).toBe(false);
    expect(cardOf().style.getPropertyValue('--card-bg').toUpperCase()).toBe('#D45A46');
    // Automático vuelve al color del tablero.
    await user.click(btn);
    await user.click(screen.getByText('Automático'));
    expect(cardOf().style.getPropertyValue('--card-bg').toUpperCase()).not.toBe('#D45A46');
  }, 30_000);

  it('Personalizar barra: 5 estilos de icono y el icono del botón de color (paleta por defecto)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    await user.click(screen.getByLabelText('Personalizar barra'));
    expect(document.querySelectorAll('.icon-style').length).toBe(5);
    expect(screen.getByLabelText('Icono de color: Paleta').getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByLabelText('Icono de color: Gota'));
    expect(screen.getByLabelText('Icono de color: Gota').getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByLabelText('Iconos Relleno'));
    expect(screen.getByLabelText('Iconos Relleno').getAttribute('aria-pressed')).toBe('true');
  }, 30_000);
});
