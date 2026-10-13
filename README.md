# Portafolio · Alexander Antúnez

Sitio web personal de Alexander Abel Antúnez Meza, coordinador BIM y de obra, bachiller en Arquitectura (Lima, Perú). Página de una sola vista con seis ventanas de trabajo: Modelado y coordinación BIM (visor 3D), Supervisión y coordinación de obra, Presupuestos y adicionales, Diseño y asistencia, Concursos e investigación y Docencia.

Vite + GSAP + Lenis + three.js. Sin servidor: el resultado es un sitio estático.

## Probarlo en tu computadora
1. Instala Node.js 20.19 o superior (nodejs.org).
2. En esta carpeta: `npm install` y luego `npm run dev`.
3. Abre la dirección que muestra (normalmente http://localhost:5173).

## Generar el sitio
- `npm run build` crea la carpeta `dist/` (sitio completo, rutas relativas: funciona en la raíz de un dominio o en una subcarpeta).
- `npm run preview` sirve `dist/` para revisarlo antes de subir.
- `npx vite build -c vite.inline.config.js && python3 tools/make_artifact.py <carpeta>` genera la variante de un solo archivo HTML que se usa para la vista previa compartida.

## Publicación en GitHub Pages
El sitio está publicado en https://alexantunez1604-code.github.io/ (repositorio `alexantunez1604-code/alexantunez1604-code.github.io`, público). Cada cambio que se sube a la rama `main` dispara `.github/workflows/pages.yml`, que instala dependencias con `npm ci`, compila con `npm run build` y publica `dist/` en unos 30 segundos. Las etiquetas Open Graph de `index.html` (`og:url`, `og:image`, `twitter:image`) apuntan a esa dirección: si cambia el repositorio o el dominio, hay que actualizarlas.

## Estructura
- `index.html`  contenido y textos de la página, metadatos y datos estructurados
- `src/main.js`  scroll suave, animaciones, línea de tiempo, las seis ventanas (enlaces directos `#bim`, `#obra`, `#presupuestos`, `#diseno`, `#concursos`, `#docencia`), visor de láminas y formulario de contacto
- `src/portada.js` y `src/hero3d.js`  portada con el modelo 3D central y Método en cuatro etapas
- `src/bimviewer.js`  visor 3D de modelos BIM (three.js): color por sistema, material, nivel o fase; despiece; caja de corte; ficha de elementos
- `src/bim.js`  ventana 01: biblioteca de 10 modelos, pestañas Modelo, Ficha, Metrados, Calidad y Corte · `src/bimreg.js`  lista de modelos (generada por `tools/bim/registry.py`, no se edita a mano)
- `src/style.css` (base y tipografías) · `src/v10.css` (miniaturas, ventanas, contacto) · `src/v12.css` (portada y Método) · `src/v20.css` (sistema plano: barra, botones, cotas, Quién soy) · `src/v30.css` (ventanas BIM, láminas, contacto-cajetín); se cargan en ese orden y los últimos prevalecen
- `public/img`  renders, fotografías de obra, láminas de concursos y bocetos · `public/models/m-*.bim`  los 10 modelos comprimidos (formato propio `BIM1`) y `pumarrinri-modulo.glb` (portada) · `public/*.png|svg|ico`  favicon e imagen para compartir (`og.png`)
- `tools/bim/`  de IFC a `.bim`: `tess.py` (geometría), `meta.py` (propiedades, sistemas, niveles), `pack.py` (simplifica y empaqueta), `registry.py` (tarjetas de la ventana). Requiere `pip install ifcopenshell fast-simplification numpy`. Las rutas de los IFC están en `tools/bim/cfg.py`; hay que ajustarlas a la carpeta de modelos del equipo
- `tools/process_sketches.py`  limpia y recolorea bocetos escaneados (fondo de papel → transparencia, paleta fría del sitio). Uso: `python3 tools/process_sketches.py <carpeta_con_los_originales>` (requiere `pip install pillow numpy scipy opencv-python`)
- `tools/make_artifact.py`  empaqueta la variante de un solo archivo (ver «Generar el sitio»)

## Créditos de imágenes
Todas las imágenes del sitio provienen del archivo de Alexander Antúnez: renders y modelos de sus propios proyectos, fotografías de obra, láminas de concursos y bocetos. Los trabajos desarrollados para Bienestudio Arquitectura llevan en el sitio el crédito «Proyecto: Bienestudio Arquitectura · Modelado y coordinación BIM: Alexander Antúnez».

## Historial
Ver `CHANGELOG.md`.

## Derechos de autor

© 2026 Alexander Abel Antúnez Meza. Todos los derechos reservados. El código, las imágenes, los modelos 3D y los textos de este repositorio se publican únicamente para que el sitio funcione; no pueden copiarse, modificarse ni reutilizarse sin autorización escrita del autor. Los créditos de cada proyecto figuran en el sitio.
