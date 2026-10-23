// Datos de ejemplo de la maqueta («Cuaderno · Funciones de la maqueta», apartados 17 y 18).
// Se cargan solo en un cuaderno nuevo. Los textos están copiados tal cual de la maqueta.
import { builtinCalendars, calendarToDoc, cardToDoc, DEFAULT_SETTINGS, DEFAULT_THEME, eventToDoc, folderToDoc, JOURNAL_ID, projectToDoc, settingsToDoc, tagsToDoc, assetToDoc } from './model';
import type { Asset, Card, CalEvent, CheckItem, Doc, Folder, Project, Settings, Stroke, Theme } from './model';
import { allStates, pmTemplate } from './pm';
import type { Col, Pm, Row } from './pm';
import { dailyId } from './store';

const BODIES: Record<string, string> = {
 "h1": "## Esta es tu página de inicio\nEdítala como quieras: **mueve**, cambia el tamaño o borra tarjetas, y añade las tuyas con «Añadir tarjeta».\n\n- [ ] Escribir mis objetivos del mes\n- [ ] Probar los widgets de *Hoy* y *Próximos 7 días*\n\n> Accesos rápidos: [[Mudanza de octubre|Mudanza]] · [[Curso de fotografía|Fotografía]]",
 "k5": "### Llaves\nLas **llaves del trastero** están en el cajón de la entrada.\n\n- [ ] Avisar al portero *24 h antes* para el ascensor\n- [x] Reservar el camión\n\n> Ver también [[Casa · semana/Compra|la lista de la compra]] #mudanza",
 "k11": "## Interfaz\n- Cuadrícula **libre**, tarjetas de distintos tamaños\n- Arrastrar y soltar con *imán*\n- Editar el texto con un clic\n- Tareas y subtareas en las checklists\n\n## Datos\n- [x] Copias automáticas en archivo\n- [ ] Decidir fechas en tareas\n\n`100% local` #diseño",
 "k13": "## Notas internas de desarrollo\n\n### Nota 1 · Funciones generales de la app\nNo son de la Tabla PM. Se implementarán **después de terminar la maqueta de la Tabla PM**:\n\n- [x] #7 Vista de grafo\n- [x] #8 Nota diaria\n- [x] #10 Paleta de color extraída\n- [x] #11 Flechas entre tarjetas\n- [x] #12 Tarjeta de boceto\n- [x] #17 Cifrado con contraseña\n\n### Nota 2 · Plan de pruebas de la Tabla PM\nAl terminar las 4 fases de la maqueta, recorrer la checklist [[Diseño de mi app/Plan de pruebas · Tabla PM|Plan de pruebas · Tabla PM]].\n\n### Nota 3 · Resultados de la Fase 1\n- [x] 12/12 pruebas automáticas superadas (lógica)\n- [x] Mejora: Tab salta los botones ocultos de las filas\n- [ ] Confirmar a mano: orden de Tab, arrastres reales y aspecto visual\n\n### Nota 4 · Resultados de la Fase 2\n- [x] 9/9 pruebas automáticas superadas\n- [x] Corrección: el .md exportado pone entre comillas los valores con «: » y usa tipos de Obsidian (casilla = true/false, fecha + fecha_fin)\n- [ ] Confirmar a mano: abrir un .md exportado en Obsidian\n\n### Nota 5 · Resultados de la Fase 3\n- [x] 8/8 pruebas automáticas superadas\n- [x] Error corregido: identificadores repetidos al crear reglas de formato y etiquetas globales\n- [x] Mejoras: la página de la fila se cierra al hacer clic fuera; asa ⋮⋮ con menú de fila (abrir, duplicar, insertar, archivar, eliminar); eliminar columna desde su menú y desde Propiedades\n- [ ] Pendiente: que el cronómetro sobreviva a recargar (solo en la app real)\n\n### Nota 6 · Resultados de la Fase 4\n- [x] 8/8 pruebas automáticas superadas\n- [x] Corregido: CSV con coma exporta decimales con punto; los resúmenes se exportan como números\n- [x] Corregido: un resumen toma el formato de la columna que resume (sin «€» al sumar casillas)\n- [ ] Confirmar a mano: abrir el CSV exportado en Excel o LibreOffice\n\n### Nota 7 · Pruebas generales\n- [x] 7/8 superadas; la de navegadores necesita prueba real\n- [x] Corregido: algunas acciones necesitaban deshacer dos veces\n- [x] Corregido: crear una etiqueta desde la celda = un solo paso de deshacer\n- [x] Corregido: icono de la flecha de volver legible sobre colores claros\n- [x] Nuevo: «Copiar para pegar en Excel» (tabla real, no texto con «;»)\n- [x] Nuevo: filas por tandas de 100 para tablas grandes\n- [x] Mejora: la búsqueda abre directamente la página de la fila\n- [ ] Pendiente: probar en Brave, Firefox y Safari\n- [ ] Idea: actualizar los enlaces [[ ]] al renombrar una fila\n### Nota 8 · Seguridad de la versión definitiva\n**Modelo de amenazas**\n- Sin cifrado: quien use el navegador lo ve todo (la app o F12 → IndexedDB)\n- Con cifrado y app bloqueada: solo hay datos cifrados; hace falta la contraseña o las 24 palabras\n- Con la app abierta: el cifrado no protege una sesión a la vista → bloqueo automático corto\n- Límite: si el ordenador ya está comprometido (extensión maliciosa, keylogger), pueden capturar la contraseña al escribirla\n\n**Ya hecho en la maqueta**\n- [x] AES-256-GCM para datos, copias internas y backups\n- [x] Clave de datos envuelta con la contraseña (PBKDF2-SHA256, 600.000 iter.) y con 24 palabras BIP-39\n- [x] Al bloquear se borran de la memoria visible los datos y el historial de deshacer\n- [x] Bloqueo automático por inactividad; la contraseña no se guarda\n\n**Pendiente para la versión definitiva**\n- [ ] Argon2id en lugar de PBKDF2 para derivar la clave de la contraseña\n- [ ] Empaquetar como app de escritorio (p. ej. Tauri): fuera del navegador y sus extensiones\n- [ ] Llavero del sistema y desbloqueo con Touch ID / Windows Hello\n- [ ] Sin recursos externos: fuentes y librerías incluidas en la app\n- [ ] Política de seguridad de contenido (CSP) estricta\n- [ ] Nunca insertar HTML del usuario; tratar notas, CSV y backups importados como texto\n- [ ] Origen propio para la app (no compartir dominio con otras páginas)\n- [ ] Opción: bloquear al minimizar u ocultar la ventana\n- [ ] Limpiar el portapapeles tras copiar las palabras de recuperación\n- [ ] Si sigue en navegador: recomendar un perfil dedicado sin extensiones",
 "k21": "### Café Aurora\nMural de **6 × 3 m** en la pared del fondo.\n\n- Paleta cálida, tema *amanecer en la sierra*\n- Entrega antes del **27 de octubre**\n\n> Abre la tabla con el botón **Abrir tabla** o con doble clic en su franja superior.\n\nPróximo paso: [[Encargo · Mural Café Aurora/Seguimiento del encargo/Pintado del mural|pintado del mural]]",
 "d2026-09-25": "## Plan del día\n- [x] Llamar a Café Aurora para medir la pared\n- [x] Fotos del local con luz de tarde\n\n## Notas\nLa pared norte recibe sol directo hasta las 14 h: conviene barniz con filtro UV.\nVer [[Encargo · Mural Café Aurora/Seguimiento del encargo/Barniz, limpieza y fotos finales|barniz y fotos]].",
 "d2026-09-27": "## Plan del día\n- [x] Tres miniaturas de composición\n- [ ] Elegir paleta definitiva\n\n## Ideas y bocetos\nProbar la paleta del [[Encargo · Mural Café Aurora/Paleta · amanecer|amanecer]] con un azul más frío en la sierra.",
 "d2026-09-28": "## Plan del día\n- [ ] Enviar bocetos al cliente\n- [ ] Pedir presupuesto del andamio\n\n## Notas\nRepasar el [[Encargo · Mural Café Aurora/Brief|brief]] antes de la reunión del jueves.",
 "px2": "## Objetivo\nTres propuestas de composición para el mural, con **luz de amanecer** y la sierra al fondo.\n\n- [x] Fotos de referencia del local\n- [x] Tres miniaturas\n- [ ] Elegir la definitiva con el cliente\n\n> Ver el brief en [[Encargo · Mural Café Aurora/Brief|Brief del café]]"
};
const STROKES: Stroke[] = [{"c":"#1F1D1A","s":3,"p":[[20.0,200.0],[29.0,194.9],[38.0,190.0],[47.0,185.4],[56.0,181.2],[65.0,177.5],[74.0,174.4],[83.0,172.1],[92.0,170.5],[101.0,169.8],[110.0,169.8],[119.0,170.8],[128.0,172.5],[137.0,174.9],[146.0,178.0],[155.0,181.6],[164.0,185.7],[173.0,190.1],[182.0,194.6],[191.0,199.2],[200.0,203.7],[209.0,207.9],[218.0,211.7],[227.0,215.0],[236.0,217.6],[245.0,219.6],[254.0,220.8],[263.0,221.2],[272.0,220.8],[281.0,219.5],[290.0,217.4],[299.0,214.6],[308.0,211.2],[317.0,207.1],[326.0,202.6],[335.0,197.8],[344.0,192.8],[353.0,187.7],[362.0,182.7],[371.0,177.9],[380.0,173.5]],"o":1},{"c":"#1F1D1A","s":2,"p":[[20.0,213.2],[29.0,211.8],[38.0,211.1],[47.0,211.1],[56.0,212.0],[65.0,213.5],[74.0,215.7],[83.0,218.4],[92.0,221.4],[101.0,224.7],[110.0,228.0],[119.0,231.1],[128.0,233.9],[137.0,236.2],[146.0,237.8],[155.0,238.8],[164.0,239.0],[173.0,238.4],[182.0,237.1],[191.0,235.1],[200.0,232.6],[209.0,229.6],[218.0,226.4],[227.0,223.1],[236.0,219.9],[245.0,217.0],[254.0,214.5],[263.0,212.7],[272.0,211.5],[281.0,211.0],[290.0,211.3],[299.0,212.4],[308.0,214.2],[317.0,216.5],[326.0,219.4],[335.0,222.5],[344.0,225.8],[353.0,229.0],[362.0,232.1],[371.0,234.7],[380.0,236.8]],"o":1},{"c":"#F28C38","s":4,"p":[[334.0,80.0],[333.5,85.9],[331.9,91.6],[329.4,97.0],[326.0,101.9],[321.9,106.0],[317.0,109.4],[311.6,111.9],[305.9,113.5],[300.0,114.0],[294.1,113.5],[288.4,111.9],[283.0,109.4],[278.1,106.0],[274.0,101.9],[270.6,97.0],[268.1,91.6],[266.5,85.9],[266.0,80.0],[266.5,74.1],[268.1,68.4],[270.6,63.0],[274.0,58.1],[278.1,54.0],[283.0,50.6],[288.4,48.1],[294.1,46.5],[300.0,46.0],[305.9,46.5],[311.6,48.1],[317.0,50.6],[321.9,54.0],[326.0,58.1],[329.4,63.0],[331.9,68.4],[333.5,74.1],[334.0,80.0]],"o":1},{"c":"#5E7A2E","s":3,"p":[[95,205.0],[95,198.0],[95,191.0],[95,184.0],[95,177.0],[95,170.0],[95,163.0],[95,156.0],[95,149.0],[95,142.0],[95,135.0]],"o":1},{"c":"#5E7A2E","s":5,"p":[[125.0,125.0],[124.3,130.0],[122.4,134.8],[119.3,139.1],[115.1,142.8],[110.0,145.8],[104.3,147.8],[98.1,148.9],[91.9,148.9],[85.7,147.8],[80.0,145.8],[74.9,142.8],[70.7,139.1],[67.6,134.8],[65.7,130.0],[65.0,125.0],[65.7,120.0],[67.6,115.2],[70.7,110.9],[74.9,107.2],[80.0,104.2],[85.7,102.2],[91.9,101.1],[98.1,101.1],[104.3,102.2],[110.0,104.2],[115.1,107.2],[119.3,110.9],[122.4,115.2],[124.3,120.0],[125.0,125.0]],"o":1}];
const PLAN: [string, string, number][] = [["tg1", "Fase 1 · Núcleo", 0], ["tt2", "Crear una Tabla PM, abrirla en grande y volver al tablero sin perder datos", 1], ["tt3", "Añadir, editar y borrar filas (y deshacerlo)", 1], ["tt4", "Crear una columna de cada tipo y cambiar el tipo de una columna con datos", 1], ["tt5", "Selección: crear, renombrar, recolorear y borrar opciones", 1], ["tt6", "Estado con fases: definir 4 fases y sus estados; desplegable agrupado por fase", 1], ["tt7", "El progreso se recalcula al cambiar el estado y llega a la barra del tablero", 1], ["tt8", "Reordenar filas y columnas arrastrando; cambiar ancho; ocultar y mostrar", 1], ["tt9", "Filtros combinados Y / O (etiqueta contiene, estado en fase, fecha vencida)", 1], ["tt10", "Orden por varias columnas", 1], ["tt11", "Fila de totales: suma, media, mín., máx., conteo y % de casillas", 1], ["tt12", "Navegación con teclado: flechas, Enter y Tab", 1], ["tt13", "Etiquetas globales: una etiqueta nueva aparece en otra tabla; renombrarla se propaga", 1], ["tg14", "Fase 2 · Páginas y organización", 0], ["tt15", "Abrir una fila como página y editar sus propiedades desde el panel", 1], ["tt16", "Descripción en Markdown y subtareas dentro de la página", 1], ["tt17", "Enlaces de vuelta: una nota que enlaza la fila aparece en «Enlazado desde»", 1], ["tt18", "Comando «/»: insertar cada tipo de bloque", 1], ["tt19", "Exportar una fila en .md y abrirla en Obsidian o en un editor de texto", 1], ["tt20", "Kanban: arrastrar entre columnas cambia el estado; agrupar por fase o responsable", 1], ["tt21", "Historial: cada cambio de estado queda con su fecha; tiempo pasado en cada fase", 1], ["tt22", "Archivar y desarchivar filas; decidir si cuentan en totales y progreso", 1], ["tt23", "Plantillas: crear una tabla desde plantilla y guardar una tabla propia como plantilla", 1], ["tg24", "Fase 3 · Tiempo y fechas", 0], ["tt25", "Cronología: arrastrar y estirar barras cambia las fechas; zoom por días, semanas y meses", 1], ["tt26", "Dependencias: mover una tarea bloqueante avisa o desplaza las dependientes", 1], ["tt27", "Hitos visibles en la cronología", 1], ["tt28", "Vista Calendario de la tabla", 1], ["tt29", "Las filas con fecha aparecen en Hoy y en el Calendario; al abrirlas se va a la fila", 1], ["tt30", "Recurrentes: al completar se genera la siguiente con la fecha correcta", 1], ["tt31", "Cronómetro: iniciar y pausar, varias sesiones, solo uno activo a la vez, sobrevive a recargar", 1], ["tt32", "Formato condicional: reglas (vencida, bloqueada…) y prioridad entre reglas", 1], ["tg33", "Fase 4 · Cálculo y conexiones", 0], ["tt34", "Fórmulas: aritmética, texto, fechas y condiciones (si…)", 1], ["tt35", "Fórmulas: error claro si es inválida; siguen funcionando al renombrar una columna", 1], ["tt36", "Relaciones: enlazar filas entre tablas y ver resúmenes (suma, conteo)", 1], ["tt37", "Relaciones: qué pasa al borrar o archivar una fila relacionada", 1], ["tt38", "Vistas enlazadas en el Inicio con filtros propios; editar ahí actualiza el original", 1], ["tt39", "Imágenes: añadir y quitar; vista Galería; espacio ocupado en el almacenamiento", 1], ["tt40", "Exportar CSV y abrirlo en Excel / LibreOffice (tildes, comas y saltos de línea)", 1], ["tt41", "Importar CSV de Excel o Google Sheets y asignar las columnas", 1], ["tg42", "Pruebas generales", 0], ["tt43", "Deshacer y rehacer en todas las acciones de la tabla", 1], ["tt44", "La tabla entra en los backups (automático, interno y manual) y se restaura completa", 1], ["tt45", "La búsqueda global encuentra filas y celdas", 1], ["tt46", "Una Tabla PM borrada va a la papelera y se restaura con todo", 1], ["tt47", "Enlaces [[ ]] a filas desde las notas", 1], ["tt48", "Legibilidad con todos los ambientes, colores de tarjeta y modo oscuro", 1], ["tt49", "Rendimiento fluido con 500 filas o más", 1], ["tt50", "Funciona en Brave, Firefox y Safari", 1]];
const PLAN_DONE = new Set(['tt43', 'tt44', 'tt45', 'tt46', 'tt47', 'tt48', 'tt49', 'tt34', 'tt35', 'tt36', 'tt37', 'tt38', 'tt39', 'tt40', 'tt41', 'tt25', 'tt26', 'tt27', 'tt28', 'tt29', 'tt30', 'tt32', 'tt15', 'tt16', 'tt17', 'tt18', 'tt19', 'tt20', 'tt21', 'tt22', 'tt23', 'tt2', 'tt3', 'tt4', 'tt5', 'tt6', 'tt7', 'tt8', 'tt9', 'tt10', 'tt11', 'tt12', 'tt13']);

const theme = (board: Theme['board'], texture: Theme['texture'], card: Theme['card'], cardTexture: Theme['cardTexture']): Theme => ({ board, texture, card, cardTexture });
const svgImg = (bg: string, hill: string, sun: string, hill2: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='${bg}'/><circle cx='420' cy='150' r='70' fill='${sun}'/><path d='M0 290 L140 170 L250 250 L370 150 L600 300 L600 400 L0 400Z' fill='${hill2}'/><path d='M0 330 L180 250 L330 320 L470 240 L600 330 L600 400 L0 400Z' fill='${hill}'/></svg>`);

type Base = { id: string; project: string; x: number; y: number; w: number; h?: number; z: number; title: string; color?: string | null };
let order = 0;
const base = (b: Base) => ({ id: b.id, project: b.project, x: b.x, y: b.y, w: b.w, h: b.h ?? 0, z: b.z, title: b.title, color: b.color ?? null, pos: order++, trashed: null });

const check = (b: Base, items: [string, string, number?][]): Card => ({ ...base(b), type: 'check', items: items.map(([id, text, lvl]): CheckItem => ({ id, text, done: PLAN_DONE.has(id) || ['a1', 'a2', 'a3', 'b1', 'c2', 'd1'].includes(id), level: lvl ?? 0 })) });
const reminder = (b: Base, when: string, bell: boolean): Card => ({ ...base(b), type: 'reminder', when, bell, note: '' });
const note = (b: Base, body: string): Card => ({ ...base(b), type: 'note', body });

/** Cuaderno de ejemplo: «Mi espacio» y cinco tareas principales, notas del Diario, calendarios y etiquetas. */
export function sampleDocs(): Doc[] {
  const docs: Doc[] = [];
  const folders: Folder[] = [{ id: 'f1', name: 'Casa y vida', collapsed: false, pos: 0 }, { id: 'f2', name: 'Aprendizaje', collapsed: false, pos: 1 }];
  const projects: Project[] = [
    { id: 'home', name: 'Mi espacio', color: '#3A4F7A', home: true, folder: null, pos: 0, trashed: null, links: [], theme: theme('papel', 'puntos', 'papel', 'liso'), titleFont: { family: 'elegante', size: 'XL', weight: 'bold', italic: false, color: null } },
    { id: 'p1', name: 'Mudanza de octubre', color: '#B4532A', folder: 'f1', pos: 1, trashed: null, links: [], theme: theme('papel', 'liso', 'papel', 'liso') },
    { id: 'p2', name: 'Curso de fotografía', color: '#2F6690', folder: 'f2', pos: 2, trashed: null, links: [], theme: theme('noche', 'puntos', 'grafito', 'liso') },
    { id: 'p3', name: 'Casa · semana', color: '#5E7A2E', folder: 'f1', pos: 3, trashed: null, links: [], theme: theme('papel', 'cuaderno', 'crema', 'liso') },
    { id: 'p4', name: 'Diseño de mi app', color: '#7A3E6B', folder: null, pos: 4, trashed: null, links: [], theme: theme('papel', 'acuarela', 'blanco', 'liso') },
    { id: 'p5', name: 'Encargo · Mural Café Aurora', color: '#0E7C7B', folder: null, pos: 5, trashed: null, theme: theme('papel', 'liso', 'papel', 'liso'),
      links: [{ id: 'ln1', from: 'k21', to: 'k20', label: 'contexto', color: null, both: false }, { id: 'ln2', from: 'k23', to: 'k24', label: 'paleta', color: null, both: false }, { id: 'ln3', from: 'k25', to: 'k23', label: 'idea', color: '#E2B65B', both: false }] },
  ];

  const cards: Card[] = [];
  // Mi espacio
  const h = (id: string, x: number, y: number, w: number, z: number) => ({ id, project: 'home', x, y, w, z });
  cards.push(note({ ...h('h1', 0, 0, 432, 1), title: 'Bienvenida' }, BODIES.h1));
  cards.push({ ...base({ ...h('h2', 456, 0, 312, 2), title: 'Hoy' }), type: 'widget', widget: 'today' });
  cards.push({ ...base({ ...h('h3', 792, 0, 276, 3), title: 'Mis tareas principales' }), type: 'widget', widget: 'projects' });
  cards.push({ ...base({ ...h('h4', 456, 216, 312, 4), title: 'Próximos 7 días' }), type: 'widget', widget: 'upcoming' });
  cards.push(check({ ...h('h5', 0, 384, 432, 5), title: 'Esta semana' }, [['hw1', 'Llamar a la inmobiliaria'], ['hw2', 'Salida de fotografía a la hora dorada'], ['hw3', 'Regar las plantas']]));
  // Mudanza de octubre
  cards.push(check({ id: 'k1', project: 'p1', x: 0, y: 0, w: 330, z: 1, title: 'Cajas y embalaje' }, [['g1', 'Comprar material'], ['a1', 'Conseguir 30 cajas', 1], ['a2', 'Cinta y rotuladores', 1], ['g2', 'Empaquetar'], ['a3', 'Libros', 1], ['a4', 'Cocina', 1], ['a6', 'Ropa de invierno', 1], ['a5', 'Etiquetar por habitación']]));
  cards.push(reminder({ id: 'k2', project: 'p1', x: 354, y: 0, w: 390, z: 2, title: 'Llamar a la inmobiliaria' }, '2026-10-02T10:00', true));
  cards.push({ ...base({ id: 'k3', project: 'p1', x: 768, y: 0, w: 300, z: 3, title: 'Presupuesto' }), type: 'table', heads: ['Concepto', 'Importe', 'Estado'], rows: [{ id: 't1', cells: ['Camión', '180 €', 'Reservado'] }, { id: 't2', cells: ['Cajas', '45 €', 'Pagado'] }, { id: 't3', cells: ['Limpieza', '90 €', 'Pendiente'] }] });
  cards.push(check({ id: 'k4', project: 'p1', x: 354, y: 176, w: 300, z: 4, title: 'Trámites' }, [['b1', 'Cambiar dirección en el banco'], ['b2', 'Dar de alta la luz'], ['b3', 'Avisar al trabajo']]));
  cards.push(note({ id: 'k5', project: 'p1', x: 0, y: 500, w: 330, h: 190, z: 5, title: 'Para no olvidar' }, BODIES.k5));
  // Curso de fotografía
  cards.push(check({ id: 'k6', project: 'p2', x: 0, y: 0, w: 380, z: 1, title: 'Módulo 3 · Luz natural' }, [['c1', 'Ver la clase grabada'], ['c2', 'Leer apuntes'], ['c3', 'Salida a la hora dorada']]));
  cards.push(reminder({ id: 'k7', project: 'p2', x: 410, y: 48, w: 360, z: 2, title: 'Entregar ejercicio' }, '2026-10-09T23:59', false));
  // Casa · semana
  cards.push(check({ id: 'k8', project: 'p3', x: 0, y: 0, w: 290, z: 1, title: 'Compra' }, [['d1', 'Fruta'], ['d2', 'Café'], ['d3', 'Detergente'], ['d4', 'Pan']]));
  cards.push(reminder({ id: 'k9', project: 'p3', x: 314, y: 0, w: 360, z: 2, title: 'Regar las plantas' }, '2026-09-30T19:00', true));
  cards.push(reminder({ id: 'k12', project: 'p3', x: 314, y: 168, w: 360, z: 3, title: 'Pagar el recibo del agua' }, '2026-09-26T12:00', true));
  // Diseño de mi app
  cards.push(reminder({ id: 'k10', project: 'p4', x: 0, y: 0, w: 460, z: 2, title: 'Decidir: ¿editar sobre el tablero o abrir la tarjeta en grande?' }, '2026-09-28T18:00', true));
  cards.push(note({ id: 'k11', project: 'p4', x: 490, y: 0, w: 420, h: 240, z: 1, title: 'Decisiones tomadas' }, BODIES.k11));
  cards.push(note({ id: 'k13', project: 'p4', x: 0, y: 192, w: 460, h: 280, z: 3, title: 'Notas internas de desarrollo', color: '#FFF3C4' }, BODIES.k13));
  cards.push(check({ id: 'k14', project: 'p4', x: 490, y: 264, w: 460, z: 4, title: 'Plan de pruebas · Tabla PM' }, PLAN.map(([id, text, lvl]) => [id, text, lvl] as [string, string, number])));

  // Encargo · Mural Café Aurora
  const tags = [{ id: 'tg1', name: 'Ilustración', color: 'blue' }, { id: 'tg2', name: 'Pintura', color: 'green' }, { id: 'tg3', name: 'Cliente', color: 'orange' }, { id: 'tg4', name: 'Urgente', color: 'red' }, { id: 'tg5', name: 'Digital', color: 'purple' }];
  const T: Pm = pmTemplate();
  const C: Record<string, Col> = {}; T.cols.forEach((c) => { C[c.name] = c; });
  const S: Record<string, string> = {}; allStates(C['Estado']).forEach(({ st }) => { S[st.name] = st.id; });
  const O: Record<string, string> = {}; (C['Responsable'].opts ?? []).forEach((o) => { O[o.name] = o.id; });
  const now = Date.now(), day = 86_400_000, hr = 3_600_000;
  const TIME: Col = { id: 'pxc10', name: 'Tiempo', type: 'timer', w: 130 };
  T.cols = [...T.cols, TIME];
  const row = (id: string, name: string, st: string, resp: string, tg: string[], a: string, b: string, hours: number, eur: number, fact: boolean, extra: Partial<Row> = {}): Row => ({
    id, hist: st ? [{ state: S[st], at: now }] : [],
    cells: { [C['Tarea'].id]: name, [C['Estado'].id]: st ? S[st] : null, [C['Responsable'].id]: O[resp], [C['Etiquetas'].id]: tg, [C['Fechas'].id]: a ? { start: a, end: b } : null, [C['Horas'].id]: hours, [C['Presupuesto'].id]: eur, [C['Facturado'].id]: fact },
    ...extra,
  });
  const px2hist = [['Bocetos', 20], ['Primera versión', 12], ['Revisión interna', 4]].map(([n, d]) => ({ state: S[n as string], at: now - (d as number) * day }));
  T.rows = [
    row('px1', 'Reunión inicial y contrato', 'Contratado', 'Cliente', ['tg3'], '2026-09-01', '2026-09-03', 3, 0, true),
    row('px2', 'Bocetos de composición', 'Revisión interna', 'Yo', ['tg1'], '2026-09-07', '2026-09-18', 14, 600, true, { desc: BODIES.px2, hist: px2hist, subs: [{ id: 'sbx1', text: 'Miniatura A · horizonte bajo', done: true }, { id: 'sbx2', text: 'Miniatura B · árbol en primer plano', done: true }, { id: 'sbx3', text: 'Miniatura C · vista cenital', done: false }] }),
    row('px3', 'Paleta de color y pruebas de material', 'Primera versión', 'Yo', ['tg2'], '2026-09-21', '2026-09-30', 10, 300, false),
    row('px4', 'Presentación al cliente', 'Bocetos', 'Cliente', ['tg3', 'tg4'], '2026-09-25', '', 2, 0, false, { milestone: true }),
    row('px5', 'Pintado del mural', '', 'Yo', ['tg2'], '2026-10-05', '2026-10-23', 48, 2400, false),
    row('px6', 'Barniz, limpieza y fotos finales', '', 'Colaborador', ['tg2', 'tg4'], '2026-10-24', '2026-10-27', 6, 250, false),
    row('px7', 'Informe de avance al cliente', '', 'Yo', ['tg3'], '2026-10-02', '', 1, 0, false, { recur: 'week' }),
    row('px0', 'Visita al local (primera idea)', 'Contratado', 'Yo', ['tg3'], '2026-08-28', '', 1, 0, true, { archived: true }),
  ];
  const R: Record<string, Row> = {}; T.rows.forEach((r) => { R[r.id] = r; });
  const assets: Asset[] = [
    { id: 'imgs1', card: 'k20', mime: 'image/svg+xml', data: svgImg('#F6D7B0', '#7A4E2D', '#F28C38', '#B9774A') },
    { id: 'imgs2', card: 'k20', mime: 'image/svg+xml', data: svgImg('#DCE7EF', '#3D5A6C', '#F6C744', '#7FA0B5') },
    { id: 'imgs3', card: 'k20', mime: 'image/svg+xml', data: svgImg('#FBEBD6', '#C0532B', '#E8A33B', '#E37B40') },
    { id: 'imgref', card: 'k23', mime: 'image/svg+xml', data: svgImg('#F6D7B0', '#7A4E2D', '#F28C38', '#B9774A') },
  ];
  const col = (id: string, name: string, type: Col['type'], w: number, extra: Partial<Col> = {}): Col => ({ id, name, type, w, ...extra });
  const IMG = col('pxc11', 'Referencias', 'image', 170);
  const MAT = col('pxc12', 'Materiales', 'relation', 230, { target: 'k22' });
  const ROLL = col('pxc13', 'Coste materiales', 'rollup', 150, { rel: 'pxc12', prop: 'mtc2', fn: 'sum', fmt: 'eur', total: 'sum' });
  const FX1 = col('pxc14', '€ / hora', 'formula', 120, { fmt: 'eur', expr: 'if(prop("Horas") > 0, round(prop("Presupuesto") / prop("Horas"), 1), 0)', total: 'avg' });
  const FX2 = col('pxc15', 'Margen', 'formula', 120, { fmt: 'eur', expr: 'prop("Presupuesto") - prop("Coste materiales")', total: 'sum' });
  T.cols = [...T.cols, IMG, MAT, ROLL, FX1, FX2];
  R.px2.cells.pxc11 = ['imgs1', 'imgs2']; R.px3.cells.pxc11 = ['imgs3'];
  const rel = (...ids: string[]) => ids.map((r) => ({ kind: 'row' as const, card: 'k22', row: r }));
  R.px3.cells.pxc12 = rel('mt1'); R.px5.cells.pxc12 = rel('mt1', 'mt3', 'mt4', 'mt5'); R.px6.cells.pxc12 = rel('mt2');
  R.px2.cells.pxc10 = { ms: 5.5 * hr, start: null }; R.px3.cells.pxc10 = { ms: 1.75 * hr, start: null };
  T.rules = [{ id: 'ru1', filter: { id: 'rf1', col: C['Fechas'].id, op: 'overdue', val: '' }, color: 'red', bold: false }, { id: 'ru2', filter: { id: 'rf2', col: C['Progreso'].id, op: 'eq', val: '100' }, color: 'green', bold: false }];

  const mat: Pm = {
    cols: [col('mtc1', 'Material', 'text', 240, { total: 'count' }), col('mtc2', 'Coste', 'number', 120, { fmt: 'eur', total: 'sum' }), col('mtc3', 'Proveedor', 'select', 150, { opts: [{ id: 'mo1', name: 'Bellas Artes Sol', color: 'yellow' }, { id: 'mo2', name: 'Ferretería Pino', color: 'brown' }] }), col('mtc4', 'Comprado', 'checkbox', 110, { total: 'pct' })],
    rows: [
      { id: 'mt1', cells: { mtc1: 'Pintura acrílica de exterior', mtc2: 180, mtc3: 'mo1', mtc4: true }, hist: [] },
      { id: 'mt2', cells: { mtc1: 'Barniz protector UV', mtc2: 65, mtc3: 'mo1', mtc4: false }, hist: [] },
      { id: 'mt3', cells: { mtc1: 'Pinceles y rodillos', mtc2: 40, mtc3: 'mo1', mtc4: true }, hist: [] },
      { id: 'mt4', cells: { mtc1: 'Andamio (alquiler 3 semanas)', mtc2: 220, mtc3: 'mo2', mtc4: false }, hist: [] },
      { id: 'mt5', cells: { mtc1: 'Cinta y plásticos de protección', mtc2: 12, mtc3: 'mo2', mtc4: false }, hist: [] },
    ],
    filters: [], conj: 'and', sorts: [],
  };
  cards.push({ ...base({ id: 'k20', project: 'p5', x: 0, y: 0, w: 620, z: 1, title: 'Seguimiento del encargo' }), type: 'pm', pm: T });
  cards.push({ ...base({ id: 'k21', project: 'p5', x: 644, y: 0, w: 380, h: 200, z: 2, title: 'Brief' }), type: 'note', body: BODIES.k21 });
  cards.push({ ...base({ id: 'k22', project: 'p5', x: 644, y: 224, w: 380, z: 3, title: 'Materiales' }), type: 'pm', pm: mat });
  cards.push({ ...base({ id: 'k23', project: 'p5', x: 0, y: 600, w: 300, z: 4, title: 'Referencia · amanecer' }), type: 'image', asset: 'imgref', name: 'boceto-amanecer.svg' });
  cards.push({ ...base({ id: 'k24', project: 'p5', x: 328, y: 600, w: 290, z: 5, title: 'Paleta · amanecer' }), type: 'palette', colors: ['#F6D7B0', '#F28C38', '#B9774A', '#7A4E2D'], fmt: 'hex', source: 'k23' });
  cards.push({ ...base({ id: 'k25', project: 'p5', x: 644, y: 600, w: 380, z: 6, title: 'Composición rápida' }), type: 'sketch', strokes: STROKES, tool: 'pen', ink: '#1F1D1A', size: 4 });

  // Notas diarias
  const journal: Project = { id: JOURNAL_ID, name: 'Diario', color: '#8A6A3A', hidden: true, folder: null, pos: -1, trashed: null, links: [], theme: DEFAULT_THEME };
  const daily: Card[] = ['2026-09-25', '2026-09-27', '2026-09-28'].map((d, i) => ({ ...base({ id: dailyId(d), project: JOURNAL_ID, x: 0, y: 0, w: 640, z: 1, title: 'Nota del día' }), pos: i, type: 'note' as const, day: d, body: BODIES['d' + d] }));

  // Calendarios
  const events: CalEvent[] = [
    { id: 'm1', calendar: 'cal-main', title: 'Llevar el coche al taller', start: '2026-10-01T08:30', end: '2026-10-01T09:30', allDay: false, note: '', repeat: 'none' },
    { id: 'e1', calendar: 'cal-birthdays', title: 'Cumpleaños de Carlos', start: '2026-09-12', end: '2026-09-12', allDay: true, note: 'Le gustan los vinilos', repeat: 'year' },
    { id: 'e2', calendar: 'cal-birthdays', title: 'Cumpleaños de Ana', start: '2026-09-30', end: '2026-09-30', allDay: true, note: 'Comprar flores', repeat: 'year' },
    { id: 'e3', calendar: 'cal-birthdays', title: 'Cumpleaños de mamá', start: '2026-10-03', end: '2026-10-03', allDay: true, note: 'Comida familiar a las 14:00', repeat: 'year' },
    { id: 'e4', calendar: 'cal-birthdays', title: 'Llamar a Leo por su cumple', start: '2026-10-14T19:30', end: '2026-10-14T20:00', allDay: false, note: '', repeat: 'year' },
  ];
  const settings: Settings = { ...DEFAULT_SETTINGS, weekNumbers: true, dayStart: 6, dayEnd: 24, notify: true, sound: true, showMissed: true };

  docs.push(...folders.map(folderToDoc), ...[...projects, journal].map(projectToDoc), ...[...cards, ...daily].map(cardToDoc), ...assets.map(assetToDoc), tagsToDoc(tags), settingsToDoc(settings));
  docs.push(...builtinCalendars().map(calendarToDoc), ...events.map(eventToDoc));
  return docs;
}
