# Cuaderno · Mejoras de la versión 1.1.0

Registro de cada mejora: qué se pidió, qué se hizo y cómo se comprobó.

## 1 · La app «está dañada» al abrirla en macOS

**Fecha:** 22 de octubre de 2026

**Problema.** Al abrir la app en macOS aparece «La app está dañada y no se puede abrir. ¿Quieres ponerla en la papelera?». Los instaladores no llevan firma de Apple y el archivo descargado trae la marca de cuarentena; en Apple Silicon, un binario sin ninguna firma se rechaza así.

**Decisión.** No hay cuenta de Apple Developer ni se piensa tenerla; la app es de uso personal. Se firma con firma ad-hoc, que no necesita cuenta. La firma y notarización de Apple siguen fuera de alcance («Mejoras continuadas»).

**Cambios.**

- `.github/workflows/macos_V1-1-0.yml`: el paso «Compilar la app» define `APPLE_SIGNING_IDENTITY: "-"` (firma ad-hoc).
- `README.md` (Instalación): se corrige el aviso de macOS. Ya no dice que basta el clic derecho → «Abrir»; explica el mensaje de «dañada» y el comando `xattr -cr /Applications/Cuaderno.app`.

**Solución inmediata en un Mac ya instalado.** Arrastrar Cuaderno a Aplicaciones y ejecutar en Terminal `xattr -cr /Applications/Cuaderno.app`.

**Nota.** `.github/macos.yml` estaba protegido contra escritura; el cambio lo aplicó el usuario a mano en el workflow nuevo `macos_V1-1-0.yml`.

**Comprobación.** Pendiente: lanzar el workflow «Compilar para macOS», descargar el .dmg en un Mac y abrir la app. Si sigue apareciendo el aviso, se usa `xattr`. No se puede verificar en la nube.

## 2 · Papelera debajo de Diario

**Fecha:** 22 de octubre de 2026

La Papelera pasa de la parte baja de la barra lateral a la sección Vistas, justo debajo de Diario (`Sidebar.tsx`). Mantiene su contador. Prueba: `mejoras110.test.tsx`.

## 3 · Vista previa de la Tabla PM con 3 columnas

**Fecha:** 22 de octubre de 2026

En el tablero, cada fila de la tarjeta Tabla PM muestra las 3 primeras columnas visibles (en el orden de la tabla) en lugar de título, estado y progreso fijos. Los estados se ven como etiqueta de color y el progreso como barra (`PmBody.tsx`). Siguen las 6 primeras filas y «+N más».

## 4 · Checklist

**Fecha:** 22 de octubre de 2026

- Texto largo: cada tarea es un cuadro de texto que crece y parte la línea en cualquier carácter, como una terminal.
- Botón (+) junto al de plegar en cada tarea para añadir una subtarea; también en las subtareas (sub-subtareas, hasta 5 niveles). Se elimina «+ Añadir subtarea» de abajo y la pregunta «¿Dentro de qué tarea?».
- ↑ y ↓ pasan a la tarea anterior o siguiente (saltan las plegadas). En un texto de varias líneas solo pasan desde la primera o la última línea.
- Ctrl+A selecciona todas las tareas (decisión del usuario: un solo Ctrl+A). Ctrl+C las copia como Markdown, Ctrl+X las corta y Ctrl+V pega varias líneas como varias tareas; con todo seleccionado, reemplaza la lista. Un pegado es un solo paso de deshacer (acción nueva `setCheckItems`).
- Archivos: `CheckBody.tsx`, `lib/checklist.ts`, `lib/store.ts`. Pruebas: `checklist.test.ts` y `mejoras110.test.tsx`.
- Aún no está: la barra de formato de texto (Fase 5).

### Correcciones tras la primera prueba (22–23 de octubre de 2026)

- **Sangría:** cada nivel se sangra 24 px, así que la viñeta de la subtarea queda más a la derecha que la de la tarea. Enter crea la tarea nueva tras las subtareas y al mismo nivel; Tab y Mayús+Tab mueven la tarea con todo lo que cuelga de ella; marcar una tarea marca también sus subtareas, y una tarea con subtareas figura hecha cuando lo están todas las suyas.
- **↓ no bajaba:** se contaban mal las líneas visuales (el relleno sumaba una de más). Ahora el cursor y el texto se miden con la misma copia invisible (`caretAtEdge`), así ↓ pasa a la tarea siguiente desde la última línea.
- **Selección con el ratón:** dentro de una tarea el ratón selecciona texto con normalidad (para copiarlo). Al arrastrar a otra tarea, o con Mayús+clic o Mayús+↑/↓, se selecciona un bloque de tareas; Ctrl+C, Ctrl+X, Supr y Ctrl+V actúan sobre el bloque y Esc lo suelta. El portapapeles funciona con un cuadro de texto oculto, igual que una hoja de cálculo, para que sirva también en macOS.

## 5 · Color de tarjeta libre e iconos configurables

**Fecha:** 22 de octubre de 2026

**Decisiones del usuario.** Solo selector libre (se quitan los colores predefinidos y las etiquetas de color); el icono del botón es configurable y por defecto una paleta; la captura de Photoshop era solo un ejemplo del selector; los iconos tienen 5 estilos, uno parecido a Notion, libres y configurables en los ajustes de la barra lateral.

**Cambios.**

- Botón de color con icono (paleta por defecto) y selector «Color de la tarjeta»: cuadro de saturación y brillo, barra de tono, campos HSB (H, S, B) en una columna y RGB (R, G, B) en otra, HEX, nuevo y actual, «Automático», «Cancelar» y «Aceptar». El HEX se guarda exacto (una prueba detectó que pasar por HSB cambiaba un dígito).
- Las tarjetas con un color antiguo lo conservan (ya se guardaba como HEX).
- Legibilidad: el texto se elige entre el claro y el oscuro del tema y, si ninguno llega a 4,5 : 1, pasa a negro o blanco. Prueba sobre 4096 colores.
- Iconos: 53 iconos incluidos en el código (sin recursos externos) en 5 estilos: Notion (Phosphor light), Lineal (Lucide), Grueso (Phosphor bold), Relleno (Phosphor fill) y Duotono (Phosphor duotone). Licencias MIT e ISC en `THIRD_PARTY_LICENSES.md`.
- «Personalizar barra» → «Estilo de los iconos», «Iconos de la barra» e «Icono del botón de color» (Paleta, Gota, Bote de pintura, Muestras, Pincel). «Restablecer» los devuelve a Notion, a los iconos de origen y a Paleta.
- **Iconos de la barra (corrección 23 de octubre):** Inicio, Hoy, Recordatorios, Calendario, Grafo, Diario y Papelera usan estos mismos iconos y estilos (ya no son símbolos de texto). En «Iconos de la barra» se pulsa una vista y se elige uno de los 53 iconos, o «Predeterminado». Se guarda en `settings.viewIcons`. También llevan icono los botones de papelera y de mover a carpeta de cada tarea.
- Los iconos propios de cada tarea principal se estrenan en la Fase 6 (barra lateral).
- Archivos nuevos: `lib/color.ts`, `lib/icons.ts`, `lib/iconData.ts`, `components/ColorPicker.tsx`, `components/Icon.tsx`.

### Segunda corrección: copiar lo seleccionado con el ratón (23 de octubre de 2026)

- **Fallo:** tras seleccionar tareas arrastrando el ratón no se podía copiar. Al soltar, el foco no quedaba en el cuadro oculto del portapapeles. Ahora, al soltar el ratón (también fuera de la lista), el foco vuelve a ese cuadro, y Copiar y Cortar se atienden también en la propia tarjeta (`onCopy`/`onCut`). Ctrl+C copia el bloque como Markdown, igual que tras Ctrl+A. Prueba: `mejoras110.test.tsx`.

### Selector de color: corrección (23 de octubre de 2026)

- **Fallo:** el cuadro de color y la barra de tono no respondían hasta cambiar antes un número. Causa: se leía la referencia al elemento antes de que existiera, en el primer dibujo. Ahora se usa el elemento del propio evento. Una prueba falla con el código antiguo.
- **Orden de los campos:** H, S, B juntos en una columna y R, G, B juntos en otra; el HEX debajo.
- **Iconos (mejora):** cada campo lleva un icono: tono = rueda de color, saturación = gota a medias, brillo = sol; R, G y B = un punto rojo, verde y azul. Son SVG propios dentro del componente.

## 6 · Tabla PM: arrastrar columnas sin tirones (Fase 2)

**Fecha:** 23 de octubre de 2026

**Causa.** En cada movimiento del ratón se guardaba el estado del arrastre y React volvía a dibujar la tabla entera (hasta 100 filas por todas sus columnas), aunque la columna de destino no hubiera cambiado.

**Cambio.** El resaltado de la columna (o fila) de destino se pone y quita directamente en el DOM, sin estado de React, y se actualiza como mucho una vez por fotograma (`requestAnimationFrame`) y solo cuando cambia el destino. Al soltar se hace una sola operación (`moveCol` o `moveRow`). Aspecto y comportamiento iguales. El arrastre de filas usa el mismo código y también mejora.

**Archivos.** `views/PmTable.tsx`. Prueba nueva: `pmdrag.test.tsx` (el elemento destacado es el mismo del DOM, no se redibuja).

**Pendiente de ver en tu PC:** cómo se siente con una tabla grande.

## 7 · Tabla como hoja de cálculo (Fase 3a)

**Fecha:** 23 de octubre de 2026

La tarjeta Tabla se comporta como Excel. Las cabeceras cuentan como la fila superior de la cuadrícula.

- **Seleccionar y editar:** un clic selecciona la celda; doble clic, F2 o simplemente escribir la editan (escribir reemplaza el contenido). Enter confirma y baja (en la última fila crea otra), Tab confirma y va a la derecha, Esc cancela.
- **Flechas** mueven la celda activa; Mayús+flecha o arrastrar con el ratón amplían el rango; Ctrl/⌘+flecha salta al borde. Enter, Mayús+Enter, Tab y Mayús+Tab también mueven.
- **Toda la tabla:** Ctrl/⌘+A selecciona todas las celdas y las cabeceras.
- **Copiar, cortar y pegar:** Ctrl+C / X / V con texto separado por tabuladores (el formato de Excel, Calc y Google Sheets), con comillas y saltos de línea dentro de una celda. Una sola celda copiada rellena el rango elegido. Al pegar, la tabla crece con las filas y columnas que falten. Un pegado, un corte o un Supr son un solo paso de deshacer (acción nueva `tableSetRange`).
- **Autocompletado:** al escribir aparecen, bajo la celda, valores y palabras de esa columna que empiezan igual (sin distinguir mayúsculas ni tildes). ↓/↑ eligen, Enter o Tab aceptan, o clic.
- Supr / Retroceso vacían lo seleccionado. Ctrl+Z y Ctrl+Y funcionan sin salir de la tabla.
- Aún no están: las operaciones matemáticas (Fase 4) y la barra de formato (hecha, ver 11).
- Archivos: `lib/grid.ts` (motor sin interfaz), `components/cards/TableBody.tsx`, `lib/store.ts`. Pruebas: `grid.test.ts` y `tablegrid.test.tsx`. Una prueba antigua (`app.test.tsx`) lee ahora el texto de la celda, no el valor de un cuadro de texto.

## 8 · Tabla PM como hoja de cálculo (Fase 3b)

**Fecha:** 23 de octubre de 2026

Mismo motor que la Tabla (`lib/grid.ts`), aplicado a las celdas de la Tabla PM de la vista Tabla.

- **Un clic selecciona, doble clic edita.** Texto y números se editan en la propia celda. Las celdas de menú (estado, selección, etiquetas, fecha, relación, imágenes) abren su menú con doble clic o F2, no con un clic. La casilla se marca con doble clic o con la barra espaciadora. Los botones propios de la fila (abrir página, cronómetro) siguen funcionando con un clic.
- **Teclado:** flechas, Mayús+flecha, Ctrl+flecha, Tab, Enter (baja; en la última fila crea otra), F2, escribir para reemplazar, Esc (cancela la edición; después suelta la selección; después cierra la tabla), Supr, Ctrl+A (toda la tabla visible), Ctrl+Z / Ctrl+Y.
- **Copiar, cortar y pegar rangos** como texto con tabuladores. Se copia el mismo texto que la exportación a CSV (decimales con coma, fechas dd/mm/aaaa). Al pegar, cada texto se convierte al tipo de su columna: números (`1.234,5`), fechas, casillas (Sí/No), opciones y estados por su nombre. Lo que no se puede aplicar (opción o estado que no existe, número ilegible, columnas calculadas como progreso, fórmula, resumen, cronómetro, relación o imágenes) se ignora y la celda queda como estaba. Si se pegan más filas que las que hay, se añaden al final. Una celda copiada rellena el rango elegido. Pegar, cortar o Supr son un solo paso de deshacer (operación nueva `batch`).
- **Autocompletado** en las columnas de texto con las palabras de esa columna (↓/↑ eligen, Tab o Enter aceptan, o clic). Componente compartido con la Tabla: `components/SuggestList.tsx`.
- La página de fila no cambia: sus campos se editan directamente.
- Archivos: `views/PmTable.tsx`, `lib/pmgrid.ts`, `lib/pm.ts` (`batch`). Pruebas: `pmgrid.test.tsx`, `pmgrid.test.ts`. Cuatro pruebas antiguas se adaptaron al nuevo gesto (doble clic para abrir menús; leer el texto de la celda).
- Los totales, filtros, orden, agrupación y paginación funcionan igual; las posiciones de la selección son las de las filas que se ven.
- Las fórmulas con referencias están hechas (ver 12) y la barra de formato (hecha, ver 11).

## 9 · Detalles de pulido

**Fecha:** 24 de octubre de 2026

- **Selector de color más grande:** ahora mide 680 px de ancho, con campos y cifras mayores para ver bien los 6 parámetros (H, S, B, R, G, B).
- **Vista previa de la Tabla PM:** muestra una fila de cabecera con el nombre de cada columna.
- **Arrastrar una columna** (Tabla PM) ya no selecciona texto: las cabeceras no se seleccionan, el cursor es una mano y una etiqueta con el nombre acompaña al ratón.
- **Duplicar la tabla PM** en edición la cierra, igual que la «x» o Esc, para ver las dos tablas de inmediato.
- Archivos: `views/PmTable.tsx`, `components/cards/PmBody.tsx`, `styles/app.css`. Pruebas: `pmdrag.test.tsx`, `mejoras110.test.tsx`.

## 10 · Mover tareas e iconos por tarea (Fase 6)

- **Arrastrar tareas** en la barra lateral: dentro de una carpeta, entre carpetas y hacia dentro de una carpeta (línea de inserción arriba/abajo o resaltado de la carpeta). Un clic tras arrastrar no abre la tarea.
- **Alt+↑ / Alt+↓** suben o bajan la tarea seleccionada en su carpeta.
- **Icono por tarea** (desde el apartado 13, en «Personalizar tablero»): menú con los 53 iconos y «Punto de color» (el valor por defecto). Campo nuevo `Project.icon`.
- Acción nueva `moveProject` en `lib/store.ts` (renumera posiciones y guarda solo los documentos cambiados).
- Archivos: `components/Sidebar.tsx`, `lib/store.ts`, `lib/model.ts`. Pruebas: `sidebar6.test.tsx`.

## 11 · Barra de formato (Fase 5)

Formato por elemento (no Markdown), excepto la Nota, que sigue en Markdown.

- **Contenido:** negrita, cursiva, subrayado, tachado, color de texto, resaltado (con el selector libre), alineación (solo tablas) y «Quitar formato».
- **Checklist:** formato por tarea seleccionada. **Tabla:** por celda o rango, y por cabecera. **Tabla PM:** barra a la izquierda de «Archivadas» (vista Tabla; celdas de texto, número, fórmula y resumen). **Nota:** la mini barra es siempre visible, también en modo vista (al usarla entra en edición).
- Copiar y pegar lleva solo el texto, no el formato. Deshacer lo revierte en un paso.
- Datos: `CheckItem.fmt`, `TableRow.fmt`, `TableCard.headFmt`, `Row.fmt`; acciones `checkFormat`, `tableFormat` y operación `format`.
- Archivos: `lib/format.ts`, `components/FormatBar.tsx`, `CheckBody.tsx`, `TableBody.tsx`, `PmTable.tsx`, `NoteBody.tsx`. Pruebas: `format.test.ts`, `format5.test.tsx`.

## 12 · Fórmulas con referencias tipo Excel (Fase 4)

**Fecha:** 24 de octubre de 2026

Mismo lenguaje de fórmulas en la Tabla PM y en la tarjeta Tabla (`lib/formula.ts`).

- **Referencias:** `B2` (columna B, fila 2), rangos `B2:C9` y columnas enteras `B:B` o `B:D`. Los rangos se usan dentro de funciones: `suma(B2:B9)`, `promedio`, `contar`, `min`, `max`. En las funciones numéricas el texto y las celdas vacías del rango se ignoran, como en Excel.
- **Funciones en español:** `si`, `suma`, `promedio`, `contar`, `redondear`, `concatenar`, `hoy`, `maximo`, `minimo`, `largo`, `mayus`, `minus` (las inglesas siguen funcionando). Los argumentos se separan con coma o con punto y coma.
- **Tarjeta Tabla:** una celda que empieza por «=» es una fórmula (`=B2*C2`, `=suma(D2:D9)`). A1 es la cabecera de la primera columna; los datos empiezan en la fila 2. Se ve el resultado y, al editar, el texto. Encima de la tabla hay una barra con el nombre de la celda activa y su contenido, y al trabajar en la tabla cada celda muestra su nombre (A1, B2…) en una esquina. Copiar y pegar lleva el texto de la fórmula (las referencias no se desplazan al pegar). Funciones: archivos `lib/tablecalc.ts` y `components/cards/TableBody.tsx`.
- **Tabla PM:** cada columna de tipo Fórmula se calcula en todas las filas. `B2` se escribe con letras y números, pero se **guarda por identidad** (`{#id-columna:id-fila}`): al reordenar filas o columnas, ordenar o filtrar, la fórmula sigue apuntando a la misma celda, y al abrir el editor se vuelve a ver con las letras y números de ese momento. Si se borra la fila o la columna, se muestra `#REF` y el error lo explica. Las cabeceras muestran su letra (esquina superior izquierda) y la columna de agarre el número de fila (el orden de la tabla, sin contar filtros ni orden de la vista). `{B}` es el valor de la columna B en la misma fila, y `{Nombre}` sigue funcionando como antes.
- **Ventana de error:** una celda con error muestra «⚠ Error»; al hacer clic se abre una ventana con qué pasó, por qué y cómo arreglarlo (círculo, celda que no existe, división entre cero, texto en una cuenta, función desconocida, fórmula mal escrita…), con la fórmula, la celda y el mensaje exacto. Esc la cierra sin cerrar la tabla. En la Tabla hay además «Editar la fórmula».
- Archivos nuevos: `lib/tablecalc.ts`, `components/FormulaErrorDialog.tsx`; cambios en `lib/formula.ts`, `lib/pm.ts` (`storeExpr`, `displayExpr`, `colLetter`, `rowNumber`), `views/PmTable.tsx`, `components/cards/TableBody.tsx`, `styles/app.css`. Pruebas: `phase4.test.ts` y `formula4.test.tsx`.
- Decisiones donde la especificación no decía nada: el número de fila de la Tabla PM sigue el orden de los datos (así no cambia con filtros ni orden); al pegar en la Tabla las referencias no se desplazan; una fórmula de la Tabla no puede usar `{Nombre}`.

## 13 · Detalles de pulido (octubre de 2026)

- **Icono de la tarea:** ya no hay botón en cada tarea de la barra lateral; el icono (53 iconos y «Punto de color») se elige en el menú de **Personalizar tablero**, campo «Icono de la tarea».
- **Paleta extraída de una imagen:** máximo **8 colores** (antes 6). Archivos: `lib/images.ts`, `lib/graphics.ts`.
- **Tarjeta Nota sin sintaxis Markdown:** la nota es ahora un editor de texto enriquecido (`lib/richnote.ts`, `components/cards/NoteBody.tsx`). Títulos, negrita, cursiva, tachado, código, listas, casillas, citas y enlaces se ven ya formateados y se aplican con la barra de la propia tarjeta. Internamente se sigue guardando como Markdown, así que enlaces `[[ ]]`, búsqueda, grafo, copias de seguridad y notas diarias no cambian. Teclado: Enter parte el bloque, Retroceso al inicio lo convierte en párrafo, Tab sangra listas, ⌘B/⌘I, Esc sale. Al escribir `[[` se abre el selector de enlaces. Pegar interpreta Markdown; copiar lleva texto Markdown. Pruebas: `richnote.test.ts`, `noteutil.ts`.
- **Fórmulas por celda en la Tabla PM:** en columnas de Texto y Número, una celda que empieza por «=» es una fórmula como en Excel (`=B2*C3`, `=SUMA(B2:B9)`), se calcula al pulsar Enter o hacer clic fuera, y los errores muestran la ventana explicativa. Se guardan por identidad de fila y columna (como las de la fase 4). Funcionan también en orden, búsqueda, totales y exportación. **Numeración tipo Excel:** la cabecera es la fila 1 y los datos empiezan en la fila 2 (sustituye lo dicho en el apartado 12).
- **Tipos «Fórmula» y «Resumen» retirados del menú de tipos de columna.** Las columnas que ya existían siguen funcionando.
- **Funciones disponibles (español o inglés):** SUMA, PROMEDIO, CONTAR, CONTARA, MAX, MIN, SI, Y, O, NO, REDONDEAR, ABS, ENTERO, RAIZ, POTENCIA, RESIDUO, HOY, CONCATENAR, MAYUSC, MINUSC, LARGO. Argumentos separados con `;` o `,`; también `<>`. Referencias: `A1`, `A2:A34`, `A:A`.
- **Copiar toda la tabla:** Ctrl+A y Ctrl+C copian toda la tabla con los nombres de columna (formato Excel/TSV). Al pegar en otra tabla (Tabla o Tabla PM) que no tenga espacio suficiente, se crean las filas y columnas necesarias (en la Tabla PM, columnas de número o texto con los nombres copiados). Es un solo paso de deshacer.
- **Decisión:** al copiar una celda con fórmula se copia el **resultado**, no la fórmula, para que sea portable entre tablas.
- Archivos: `lib/formula.ts`, `lib/pm.ts`, `lib/pmio.ts`, `lib/pmgrid.ts`, `lib/grid.ts`, `views/PmTable.tsx`, `components/cards/TableBody.tsx`, `components/Appearance.tsx`, `components/Sidebar.tsx`, `styles/app.css`.

## 14 · Segunda tanda de pulido (octubre de 2026)

- **Tarjeta Nota editable:** el tablero cancelaba el clic sobre la tarjeta (para poder arrastrarla) y eso impedía dar foco al nuevo editor. Ahora el clic sobre el texto de la nota escribe; la cabecera de la tarjeta sigue arrastrando. Archivo: `components/Board.tsx`. Prueba: `fix7.test.tsx`.
- **Fórmulas «=» solo en columnas de número** de la Tabla PM (en una columna de texto, «=…» es texto normal). Sustituye lo dicho en el apartado 13 sobre texto y número.
- **Como en Excel, lo que no existe vale vacío:** una referencia a una fila más allá de la última (`A34`) vale vacío y en un rango (`=SUMA(G2:G34)`) se ignora. Antes daba «No existe la fila…». Vale en la Tabla PM y en la tarjeta Tabla. Una columna que no existe (`Z1`) sigue dando error.
- Nota: `=A2*B3` da error si A o B no son columnas de número (texto por número), igual que Excel.
- Archivos: `lib/pm.ts`, `lib/pmgrid.ts`, `lib/tablecalc.ts`, `views/PmTable.tsx`, `components/Board.tsx`.

## Pendiente

- Probar en tu PC (`npm run tauri dev`): editor de la Nota, fórmulas «=» en la Tabla PM y en la Tabla, ventana de error, copiar toda la tabla y pegarla en otra, icono en Personalizar tablero, paleta de 8 colores.

## Comprobación

En la nube: `npx tsc --noEmit` sin errores, 203 pruebas de Vitest correctas y `npx vite build` correcto. Pendiente en tu PC (no se puede medir en la nube): cómo se ve y se siente el ajuste de líneas, las flechas con texto largo, la selección con el ratón, el selector de color, los iconos de la barra y la capa de Tauri.
