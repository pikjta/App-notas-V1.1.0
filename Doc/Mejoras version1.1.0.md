# Cuaderno · Mejoras de la versión 1.1.0

Registro de cada mejora: qué se pidió, qué se hizo y cómo se comprobó.

## 1 · La app «está dañada» al abrirla en macOS

**Fecha:** 22 de octubre de 2026

**Problema.** Al abrir la app en macOS aparece «La app está dañada y no se puede abrir. ¿Quieres ponerla en la papelera?». Los instaladores no llevan firma de Apple y el archivo descargado trae la marca de cuarentena; en Apple Silicon, un binario sin ninguna firma se rechaza así.

**Decisión.** No hay cuenta de Apple Developer ni se piensa tenerla; la app es de uso personal. Se firma con firma ad-hoc, que no necesita cuenta. La firma y notarización de Apple siguen fuera de alcance («Mejoras continuadas»).

**Cambios.**

- `.github/macos.yml`: el paso «Compilar la app» define `APPLE_SIGNING_IDENTITY: "-"` (firma ad-hoc).
- `README.md` (Instalación): se corrige el aviso de macOS. Ya no dice que basta el clic derecho → «Abrir»; explica el mensaje de «dañada» y el comando `xattr -cr /Applications/Cuaderno.app`.

**Solución inmediata en un Mac ya instalado.** Arrastrar Cuaderno a Aplicaciones y ejecutar en Terminal `xattr -cr /Applications/Cuaderno.app`.

**Pendiente.** `.github/macos.yml` está protegido contra escritura para las herramientas remotas: el cambio (`env: APPLE_SIGNING_IDENTITY: "-"` en el paso «Compilar la app») hay que pegarlo a mano.

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
- Botón (+) junto al de plegar en cada tarea principal para añadir una subtarea. Se elimina «+ Añadir subtarea» de abajo y la pregunta «¿Dentro de qué tarea?».
- ↑ y ↓ pasan a la tarea anterior o siguiente (saltan las plegadas). En un texto de varias líneas solo pasan desde la primera o la última línea.
- Ctrl+A selecciona todas las tareas (decisión del usuario: un solo Ctrl+A). Ctrl+C las copia como Markdown, Ctrl+X las corta y Ctrl+V pega varias líneas como varias tareas; con todo seleccionado, reemplaza la lista. Un pegado es un solo paso de deshacer (acción nueva `setCheckItems`).
- Archivos: `CheckBody.tsx`, `lib/checklist.ts`, `lib/store.ts`. Pruebas: `checklist.test.ts` y `mejoras110.test.tsx`.
- Aún no está: la barra de formato de texto (Fase 5).

## 5 · Color de tarjeta libre e iconos configurables

**Fecha:** 22 de octubre de 2026

**Decisiones del usuario.** Solo selector libre (se quitan los colores predefinidos y las etiquetas de color); el icono del botón es configurable y por defecto una paleta; la captura de Photoshop era solo un ejemplo del selector; los iconos tienen 5 estilos, uno parecido a Notion, libres y configurables en los ajustes de la barra lateral.

**Cambios.**

- Botón de color con icono (paleta por defecto) y selector «Color de la tarjeta»: cuadro de saturación y brillo, barra de tono, campos H, S, B, R, G, B y HEX, nuevo y actual, «Automático», «Cancelar» y «Aceptar». El HEX se guarda exacto (una prueba detectó que pasar por HSB cambiaba un dígito).
- Las tarjetas con un color antiguo lo conservan (ya se guardaba como HEX).
- Legibilidad: el texto se elige entre el claro y el oscuro del tema y, si ninguno llega a 4,5 : 1, pasa a negro o blanco. Prueba sobre 4096 colores.
- Iconos: 53 iconos incluidos en el código (sin recursos externos) en 5 estilos: Notion (Phosphor light), Lineal (Lucide), Grueso (Phosphor bold), Relleno (Phosphor fill) y Duotono (Phosphor duotone). Licencias MIT e ISC en `THIRD_PARTY_LICENSES.md`.
- «Personalizar barra» → «Estilo de los iconos» e «Icono del botón de color» (Paleta, Gota, Bote de pintura, Muestras, Pincel). «Restablecer» los devuelve a Notion y Paleta.
- Los iconos de Vistas y de cada tarea principal se estrenan en la Fase 6 (barra lateral).
- Archivos nuevos: `lib/color.ts`, `lib/icons.ts`, `lib/iconData.ts`, `components/ColorPicker.tsx`, `components/Icon.tsx`.

## Comprobación de la Fase 1

En la nube: `npx tsc --noEmit` sin errores, 133 pruebas de Vitest correctas y `npx vite build` correcto. Pendiente en tu PC (no se puede medir en la nube): cómo se ve y se siente el ajuste de líneas, las flechas con texto largo, el selector de color con el ratón y la capa de Tauri.
