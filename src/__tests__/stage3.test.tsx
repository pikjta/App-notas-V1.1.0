// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';

afterEach(cleanup);

describe('etapa 3: tarjetas', () => {
  it('Abrir en grande, checklist con subtareas y selector «Enlazar a…»', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    expect(screen.getByText(/Arrastra por la franja superior/)).toBeTruthy();
    await user.click(screen.getByText('+ Tarea principal'));
    await user.type(screen.getByPlaceholderText('Nombre de la tarea principal'), 'Mural{Enter}');
    await user.click(screen.getByText('+ Añadir tarjeta'));
    await user.click(screen.getByRole('menuitem', { name: 'Checklist' }));
    await user.type(screen.getByPlaceholderText('Escribe una tarea…'), 'Bocetos');
    await user.click(screen.getByLabelText('Añadir subtarea'));
    await user.type(document.activeElement as HTMLElement, 'Logo');
    expect(screen.getByText('0/1')).toBeTruthy();
    await user.click(screen.getAllByLabelText('Hecha')[1]);
    expect(screen.getByText('1/1')).toBeTruthy();
    await user.click(screen.getByLabelText('Plegar subtareas'));
    expect(screen.queryByDisplayValue('Logo')).toBeNull();
    await user.click(screen.getByLabelText('Desplegar subtareas'));
    expect(screen.getByDisplayValue('Logo')).toBeTruthy();

    await user.click(screen.getByLabelText('Abrir en grande'));
    const big = screen.getByRole('dialog', { name: 'Tarjeta en grande' });
    expect(within(big).getByDisplayValue('Logo')).toBeTruthy();
    await user.click(within(big).getByText('Cerrar (Esc)'));
    expect(screen.queryByRole('dialog', { name: 'Tarjeta en grande' })).toBeNull();

    await user.click(screen.getByText('+ Añadir tarjeta'));
    await user.click(screen.getByRole('menuitem', { name: 'Nota' }));
    await user.click(screen.getByText('Nota vacía. Haz clic para escribir en Markdown.'));
    await user.click(screen.getByLabelText('Enlace a otra tarea principal'));
    const dlg = screen.getByRole('dialog', { name: 'Enlazar a…' });
    await user.type(within(dlg).getByPlaceholderText('Buscar tarea principal o tarjeta…'), 'Inicio');
    await user.click(within(dlg).getAllByRole('option')[0]);
    expect((screen.getByLabelText('Contenido de la nota (Markdown)') as HTMLTextAreaElement).value).toBe('[[Inicio|Inicio]]');
  }, 30_000);
});
