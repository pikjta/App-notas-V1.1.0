import { useState } from 'react';
import { useApp } from '../../App';
import { errorText } from '../../lib/backend';
import { extractPalette, readImage } from '../../lib/images';
import type { ImageCard, PaletteCard } from '../../lib/model';
import { uid } from '../../lib/model';
import { newCard } from '../../lib/store';

export function ImageBody({ card }: { card: ImageCard }) {
  const { state, dispatch, toast } = useApp();
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const asset = card.asset ? state.assets[card.asset] : null;

  const load = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await readImage(file);
      dispatch({ t: 'setAsset', card: card.id, asset: { id: uid('asset'), card: card.id, ...img }, name: file.name });
      if (!card.title) dispatch({ t: 'patchCard', id: card.id, patch: { title: file.name.replace(/\.[a-z0-9]+$/i, '') } });
    } catch (e) { toast(errorText(e)); }
  };

  const palette = async () => {
    if (!asset) return;
    setBusy(true);
    try {
      const colors = await extractPalette(asset.data);
      const p = newCard('palette', card.project) as PaletteCard;
      const pal: PaletteCard = { ...p, colors, title: 'Paleta · ' + (card.title || 'imagen'), source: card.id, x: card.x + card.w + 28, y: card.y };
      dispatch({ t: 'addCard', card: pal });
      dispatch({ t: 'addLink', project: card.project, link: { id: uid('link'), from: card.id, to: pal.id, label: 'paleta', color: null, both: false } });
      toast(`Paleta de ${colors.length} colores creada`);
    } catch (e) { toast(errorText(e)); }
    finally { setBusy(false); }
  };

  if (!asset) {
    return (
      <label className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); void load(e.dataTransfer.files[0]); }}>
        <span>Suelta una imagen aquí o haz clic para elegirla</span>
        <input type="file" accept="image/*" hidden onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    );
  }
  return (
    <div className="image-body">
      <img src={asset.data} alt={card.title || card.name} onClick={() => setZoom(true)} draggable={false} />
      <div className="row">
        <button className="tool small-btn" disabled={busy} onClick={() => void palette()}>{busy ? 'Leyendo colores…' : 'Extraer paleta'}</button>
        <span className="grow" />
        <label className="tool small-btn">Cambiar<input type="file" accept="image/*" hidden onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ''; }} /></label>
      </div>
      {zoom && (
        <div className="lightbox" role="dialog" aria-label={card.title || 'Imagen'} onClick={() => setZoom(false)}>
          <img src={asset.data} alt={card.title || card.name} />
          <span>{card.title || card.name}</span>
        </div>
      )}
    </div>
  );
}
