// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);
import App from '../App';

describe('enlaces [[ ]] y tipos nuevos de tarjeta', () => {
  it('escribir [[ abre el selector, enlaza y navega con «Volver»', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    await user.click(screen.getByText('+ Tarea principal'));
    await user.type(screen.getByPlaceholderText('Nombre de la tarea principal'), 'Mural Café Aurora{Enter}');
    await screen.findByRole('heading', { name: 'Mural Café Aurora' });
    await user.click(screen.getByText('+ Añadir tarjeta'));
    await user.click(screen.getByRole('menuitem', { name: 'Nota' }));
    await user.type(screen.getAllByPlaceholderText('Sin título').slice(-1)[0], 'Brief');

    await user.click(screen.getByText('Inicio'));
    await user.click(screen.getAllByTitle('Haz clic en el texto para editar')[0]);
    const ta = screen.getByLabelText('Contenido de la nota (Markdown)') as HTMLTextAreaElement;
    await user.type(ta, '{End}{Enter}Ver [[[[bri');
    const pick = screen.getByRole('listbox', { name: 'Enlazar con' });
    expect(within(pick).getAllByRole('option')[0].textContent).toContain('Brief');
    await user.keyboard('{Enter}');
    expect(ta.value).toContain('Ver [[Mural Café Aurora/Brief]]');
    await act(async () => { ta.blur(); });

    await user.click(screen.getByRole('button', { name: 'Brief' }));
    await screen.findByRole('heading', { name: 'Mural Café Aurora' });
    await user.click(screen.getByText(/^← Volver/));
    await screen.findByRole('heading', { name: 'Inicio' });
  }, 20_000);

  it('boceto, paleta e imagen se crean desde el menú; la apariencia cambia el tablero', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Inicio' });
    for (const k of ['Boceto', 'Paleta de color', 'Imagen']) {
      await user.click(screen.getByText('+ Añadir tarjeta'));
      await user.click(screen.getByRole('menuitem', { name: k }));
    }
    expect(screen.getByText('Dibuja aquí con el ratón o el lápiz')).toBeTruthy();
    expect(screen.getByText('#F6D7B0')).toBeTruthy();
    expect(screen.getByText('Suelta una imagen aquí o haz clic para elegirla')).toBeTruthy();
    await user.click(screen.getByText('RGB'));
    expect(screen.getByText('rgb(246, 215, 176)')).toBeTruthy();
    await user.click(screen.getByText('Personalizar tablero'));
    await user.click(screen.getAllByRole('button', { name: 'Noche' })[0]);
    expect(document.querySelector('main.board')?.className).toContain('dark');
  }, 20_000);
});
