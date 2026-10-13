# Historial de cambios · Portafolio Alexander Antúnez

Registro de las tandas de trabajo. Las entradas más antiguas (v0.9 a v1.9) describen recursos que ya no están en el sitio (vidrio, papel arrugado, letra manuscrita, texturas); se conservan solo como historia.

## v2.12 (tanda 7: claridad de textos)
Revisión punto por punto de todos los textos del sitio (31 puntos, aprobados por Alexander el 12/10/2026), para que el mensaje sea el mismo de principio a fin.
- Posicionamiento: el título, la descripción, los datos de compartir (og.png incluido), el encabezado y el pie pasan de «Arquitecto y coordinador BIM» a «Coordinador BIM y de obra»; la formación («bachiller en Arquitectura por la UNI, en proceso de titulación») se dice una sola vez, en «Sobre mí».
- Frase de «Sobre mí»: «Primero que funcione.» como frase principal, con la cita de La Fontaine (*Adonis*) debajo y su fuente.
- Trayectoria: Bienestudio termina en enero de 2026; nueva fila «SolBIM» (servicios BIM, negocio propio) con un marcador cuadrado en el presente, «en proceso, recibiendo proyectos»; «Constructora BERMEZ» y «Bermez» pasan a «BERMEZ» en todo el sitio.
- Textos: «Valida» pasa a «Demuestra» con frases nominales; «Otros requerimientos» a «Consultas a medida»; «Explotar» a «Despiece»; hero «Módulo 3A · Pumarrinri Amazon Lodge»; Método con «patio-teatro La Huaraca» (Escuela de Teatro Puckllay), escalas «1:100» y «1:500» y el equipo como «AOZ Arquitectos, coordinado con un equipo independiente privado»; Monte Alegre con «tolerancia máxima de 1 mm en las juntas»; «+68.1 %» con espacio fino; investigación y Docencia con frases reescritas; decimal con punto en el contador de la portada («1.5»).
- Botones del visor en celular: «Giro automático» y «Girar con un dedo» pasan a dos líneas del mismo ancho para caber a 320 px.

## v2.11 (tanda 6: biblioteca primero y visor en celular)
- Ventana 01 (Modelado y coordinación BIM): la biblioteca de modelos pasa a ir justo después de la frase de apertura. «Biblioteca de modelos» y el primer grupo de cinco modelos quedan a la vista al abrir la ventana; «Modalidades de trabajo» y «Coordinación BIM» bajan después del visor 3D, y la nota técnica (IFC, cifras y pestaña Calidad) queda como pie del visor.
- La frase «Aquí viven los modelos 3D que puedes recorrer» se vuelve un sello rojo con flecha que lleva a la biblioteca; aparece en la ventana y en la tarjeta de «Mi trabajo».
- Visor 3D en celular (auditoría propia con capturas a 320, 360, 390 px y en horizontal):
  - Deslizar con un dedo sobre el visor ahora desplaza la página (antes se quedaba atrapado). Para girar el modelo con un dedo hay un botón «Giro libre»; en modo corte el visor reserva el toque para los tiradores.
  - Las barras fijas ya no tapan los títulos al saltar a una sección; en horizontal la barra principal deja de ser fija.
  - La ficha del elemento seleccionado pasa a una barra compacta abajo, que no cubre el modelo.
  - Los tiradores de la caja de corte que apuntan a la cámara o quedan encimados se ocultan.
  - Botones táctiles más grandes y filas de modos balanceadas (3 + 2 con «Fase»); a 320 px todo cabe sin recortes.
- Corrección de ortografía en un texto de la biblioteca («se raya»).

## v2.10 (tanda 5: limpieza y auditoría)
- Se retiran las notas de diseño (`?notas`): la versión publicada ya no lleva comentarios ni modo de revisión, y los ganchos de depuración (`?debug`, `?snap`) solo se compilan con `VITE_DEBUG=1`.
- Se elimina el código y los estilos sin uso (`src/glass.css`, tipografía manuscrita, rutinas de papel rasgado, texturas, grano, funciones y variables huérfanas): CSS compilado de 146 KB a 122 KB, `index.html` de 98 KB a 92 KB.
- Se retiran de `public/` las imágenes y texturas que ningún archivo del sitio llama (28 archivos, ≈ 7,5 MB): fotografías de paisaje, imágenes de Gocta y Pumarrinri y láminas de Tuquillo de versiones anteriores, y todas las texturas.
- Sin cambios visibles: se compararon capturas de la v2.9 y la v2.10 en tres anchos (1270, 820 y 390 px), salvo los ajustes de accesibilidad de abajo.
- Accesibilidad: contraste del texto secundario (`#5A646C` a `#57616A`), del rótulo de la caja de corte y de «Hoja 0X / 0Y» del Método; las ventanas pasan de `article` a `section` con `role="tabpanel"`; orden de encabezados sin saltos; `role="group"` en el tablero de criterios. axe-core: 0 violaciones en 35 estados y 3 anchos.
- Se quitan del modelo «Baños de recepción» el correo, el teléfono y la licencia de un fabricante que venían en las propiedades de un elemento.
- `fflate` 0.8.2 a 0.8.3 (vulnerabilidad en `unzipSync`, que el sitio no usa); `npm audit` en 0.
- Herramientas: `tools/bim/cfg.py` con rutas por variable de entorno, `tools/process_sketches.py` incorporado, `.gitignore`, `CHANGELOG.md` y `publicar-pages.yml` (flujo de publicación en GitHub Pages, sin activar).
- Auditoría completa del código: ver `03_DOCUMENTACION/AUDITORIA_v2.10.md` en la carpeta del proyecto.

## Novedades v1.0 (reorganización)
Estructura nueva: presentación, seis ventanas y contacto.
- **Presentación:** inicio con accesos directos, Método (trazo, modelo, obra) y "Quién soy" en tres pestañas (perfil, trayectoria, formación y herramientas).
- **Seis ventanas con miniatura interactiva:** 01 Modelado y coordinación BIM (visor 3D y proyectos modelados), 02 Supervisión y coordinación de obra, 03 Presupuestos y adicionales, 04 Diseño y asistencia de diseño, 05 Concursos e investigación, 06 Docencia. Cada una se abre debajo de la cuadrícula, con pestañas fijas para pasar de una a otra y un cajetín de datos.
- **Contacto:** temas de consulta que arman el asunto sugerido; el correo se copia, no se abre un programa externo.
- **Material por completar** (marcado como "en preparación" o "por seleccionar"): modelos 3D adicionales, fotografías de obra, presupuestos de muestra, láminas de concursos, textos de cátedra en FAUA y ESAN.
- Todas las cifras, fechas y nombres salen de lo que Alexander confirmó; los 6 pasos del proceso de adicionales están pendientes de confirmación.

## Novedades v0.9
- Bocetos propios en Trazo (perspectiva), Proyectos (Tuquillo: sitio, sección, escala urbana), Sobre mí (cuaderno con visor ampliable) y una banda panorámica que pasa de borrosa a nítida al hacer scroll.
- Hojas de papel arrugado translúcido reales (en vez de vidrio plano) en las transiciones Trazo → Modelo → Obra, en el cuaderno y en el visor de bocetos.
- Botones nuevos: texto que rueda, marcas de esquina, interruptores con estado, círculo a mano alzada en las llamadas a la acción, imán y onda al pulsar.
- "Resultados en obra" interactivo: 12 informes con detalle al pasar el cursor, barras +68.1% con valores, 197 puntos de drenaje verificables uno a uno, 2,981 m² de enchape dibujados celda a celda con el cursor, filtro por obra y botón "Repetir".

## Novedades v1.1 (cristal)

- Nuevo `src/glass.css`, cargado al final: toda la capa de vidrio vive ahí, con tokens (`--gl-*` claro, `--sm-*` ahumado, `--r-*` radios).
- Barra superior como píldora flotante de vidrio; pestañas de ventanas y de "Quién soy" como control segmentado.
- Botones en píldoras de vidrio; sobre fotos y piezas oscuras pasan a vidrio ahumado, y el acceso principal queda en vidrio claro.
- Tarjetas de las ventanas y panel abierto con borde de luz, miniatura inscrita y sombra suave; el reflejo sigue al cursor (solo con puntero fino).
- Fondo general: campo frío fijo (azul grisáceo y verde agua), sin marrones ni amarillos. El grano global se retiró.
- Papel y cuadrículas, solo en usos puntuales: tira rasgada del inicio, lámina de las tres capas, cuaderno de láminas, caso Tuquillo y las miniaturas de papel (muy atenuado). Cuadrículas a línea fina.
- Líneas de regla en 1 px, sin negro pleno.
- Respaldo sin `backdrop-filter`, `prefers-reduced-transparency` y `prefers-contrast: more`.
- El desenfoque real solo se usa donde hay algo que desenfocar (barra, fotos, visor, lightbox) para cuidar el rendimiento en celulares.


## Novedades v1.3 (explosión por niveles y método en hojas)
- 3D de la portada: Explotar separa cuatro niveles con una distancia pareja, marcos y guías verticales, y rótulos que se pueden pasar con el cursor para aislar cada nivel: 1 Suelo (terreno, cimentación, losas, muros de contención y detalles, pegados a la topografía), 2 Estructura de madera (pilares, vigas y piso de madera), 3 Muros (wood frame, quincha, carpintería y vidrio), 4 Cubierta. Construir sigue los mismos cuatro pasos. `src/hero3d.js`.
- `tools/ifc_to_glb.py` clasifica ahora por familia del IFC en diez grupos (terreno, cimentacion, losas, contencion, detalle, estructura, entrepiso, muros, carpinteria, cubierta). Los montantes de 50 mm van a muros (wood frame); los muros `MC_` van a contención.
- Método: cuatro hojas de papel mantequilla que se sobreponen al desplazarte (escritorio) y se apilan fijas (móvil y movimiento reducido). `src/portada.js`, `src/v12.css`.

## Novedades v1.2 (portada 3D y método en cuatro etapas)
- Portada: nombre grande junto a un modelo 3D del Módulo de 3 habitaciones (Pumarrinri Amazon Lodge), con botones Explotar y Construir. `src/hero3d.js`, `public/models/pumarrinri-modulo.glb` (generado con `tools/ifc_to_glb.py`, agrupado en 7 categorías, sin datos de cliente).
- Método: "Un proyecto, cuatro etapas" con la cobertura metálica del teatro La Huaraca (Puckllay): Pensar, Modelar, Documentar, Comprobar en obra. `src/portada.js`, `src/v12.css`. En móvil y con movimiento reducido las etapas se apilan.
- Imágenes nuevas: `public/img/puck-*.webp`, `hero-3d.webp` (póster del 3D).

## Novedades v2.9 (tanda 4)
- **Concursos, Láminas:** se quitaron los tres marcadores «en preparación». Dos bloques con las siete fotos de `Desktop\Portafolio\CONCURSOS` (`public/img/co-al-1..4.webp`, `co-pb-1..3.webp`, hasta 1800 px): Alameda Central UNI (láminas L01 y L02, más dos detalles a ancho completo) y Nuevo Pabellón FAUA «Arquitectura entre patios» (láminas 1 a 3). Clases `.lmg` (`.lmg2`, `.lmg1`), `.lmz`; se ven enteras, sin recorte. Los pies describen solo lo que dicen las láminas: sin año, rol, equipo ni resultado.
- **Ampliación (lightbox) plana:** sin desenfoque ni giro, esquinas rectas, lámina entera en pantalla y toque sobre la imagen para verla a tamaño real (clase `.z` en `.lb-im`).
- **Paisaje:** una sola imagen, sin desenfoque ni ventana nítida; la frase «Primero el lugar, después la forma.» va en una franja de papel bajo la foto.
- **Cuéntame tu proyecto como cajetín de encargo (`#enc`):** tipo (chips), ubicación, plazo, nombre y detalle opcional; vista previa del asunto y del mensaje en vivo (los campos vacíos no aparecen); «Abrir en mi correo» (`mailto:` con asunto y cuerpo), «Copiar mensaje», «Copiar asunto» y «Copiar correo». Solo alexantunez1604@gmail.com; sin promesa de plazo de respuesta. Los enlaces `data-topic` de otras ventanas siguen rellenando el tipo. Lógica en `src/main.js`, bloque «contacto: cajetín de encargo».
- **Ícono y vista al compartir:** `public/favicon.svg` (círculo negro sobre fondo blanco), `favicon-32.png`, `favicon.ico`, `apple-touch-icon.png`; `public/og.png` (1200×630, estilo del sitio); etiquetas Open Graph, Twitter y JSON-LD (Person) en el `<head>`. La dirección supuesta es `https://alexantunez1604-code.github.io/`: ajustar en `index.html` si el sitio va en otra. `tools/make_artifact.py` quita estos archivos del artefacto.
- Pruebas: 1270, 820 y 390 px, con y sin movimiento reducido, en el build normal y en el del artefacto: sin errores de consola ni scroll horizontal.

## Novedades v2.8 (tanda 3e)
- **Presupuestos:** galería «Registro en obra» con cuatro fotografías de Fractal (`pr-fr-2..5.webp`, Nueva Cámara de Senadores): Alex en obra frente a los paños de vidrio, caja de escalera en acabados, caja de escalera en ejecución y fachada con andamio. Alex retiró otras dos (retrato con vista al Palacio Legislativo y vista nocturna) el 2026-10-12. Sin rótulos de aplicación; operarios de espaldas o de lejos, sin rostros identificables. Leyendas solo descriptivas; no lleva la línea «publicadas con autorización».
- **Alpes 2 (sin fotos):** la tabla «Lo que se controló» pasa a tres cifras grandes (144 ml de mueblería, 144 puertas, 360 m² de enchape), cada una con su cantidad por departamento × 24 (derivados). Reglas `.oxn3` en `src/v30.css`; se retiran las reglas `.oxm` de la tabla.
- **Docencia:** Augusto Ortiz de Zevallos aparece en la introducción de la ventana y como «Docente» en Creatividad 01 y ESAN (instrucción de Alex: nombrarlo siempre). ESAN con «Periodo: 2023-2, de agosto a diciembre de 2023». Textos de ambos cursos confirmados por Alex.
- **Pie:** sin los créditos a Unsplash ni «Borrador de diseño, versión 2.0». Los `u-*.jpg` ya no se usan en ninguna sección (se borran en la tanda 5).
- **Modelos BIM:** sin cambios (Alex: «están bien como están»).

## Novedades v2.7 (tanda 3d)
- **Topografía:** el terreno de Hotel Tucán Suites y de Pumarrinri módulo 3A se reconstruye como una superficie continua (cota más alta del terreno del IFC bajo cada nodo de una malla de 0.5 a 1 m, huecos completados con la cota vecina más cercana, zócalo lateral y base plana). Antes se recortaba en «sopa de triángulos» y se simplificaba por elemento, lo que dejaba huecos. Cobertura del IFC en la ventana de recorte: 86.8 % en Tucán y 99.5 % en el módulo 3A; el resto se completa. Código: `terrain_block` en `tools/bim/pack.py`.
- **Alineación:** Tucán estaba girado 21.75° respecto de los ejes del archivo (la caja de sección y el recorte salían en diagonal). `pack.py` calcula el giro que minimiza el rectángulo de la planta y lo aplica solo si lo mejora más de 10 %; solo Tucán lo necesitó. La cabecera del `.bim` suma `base` (cota del cero del visor) y `fc` (encuadre sobre la edificación cuando el terreno es mucho mayor).
- **Visor:** el terreno siempre se muestra (sin pastilla para ocultarlo; tampoco lo oculta el filtro por nivel). Si un IFC no trae terreno (la plantilla estructural), el visor dibuja una base neutra de apoyo y la ficha lo dice. El corte en planta va 1.3 m sobre el primer nivel con contenido (si no, en Tucán caía dentro del terreno). Terreno un poco más claro.
- **Fichas BIM:** Mástil 2 (2024, para Bermez y SRT, en asociación), Casa Nilo (2022, para Bermez) y Casa H (2024, encargo particular) con año y crédito «Proyecto y modelo: Alexander Antúnez». Bloque «Coordinación sobre el modelo» en la ventana 01 (LOD 350 en ACC, interferencias validadas en campo, as-built de cuatro viviendas).
- **Obra:** Tiendas 3A suma ocho fotografías (`ob-ti-1..8`, sin rótulos de aplicación). Monte Alegre: cargo «Asistente de Gerencia y Coordinador de Obra».
- **Presupuestos:** se quitan las cajas «por seleccionar» (presupuesto de muestra descartado; las dos fotos de Fractal siguen pendientes).
- **Docencia:** Creatividad 01 (FAUA-UNI, 2023-1 y 2023-2, 53 alumnos por ciclo) y ESAN (Maestría en Gestión y Desarrollo Inmobiliario) con funciones, resultado y aprendizaje.
- **Contacto:** el correo público pasa a alexantunez1604@gmail.com.

## Novedades v2.6 (tanda 3c: BIM)
- La ventana 01 deja las pastillas y pasa a una biblioteca de 10 modelos en tres grupos: 5 modelos de información (Gocta 1A y 1B, Hotel Tucán Suites, Pumarrinri módulo 3A y baños de recepción, con crédito a Bienestudio), 1 plantilla de muestra (estructural LOD 300 para JJCC Ingenieros) y 4 modelos de diseño (Casa Violeta, Casa H, Casa Nilo, Mástil 2).
- Un solo visor sirve para todos. Modos: sistemas, material, nivel y fase (solo si el modelo tiene fases distintas). Despiece por nivel o por sistema, caja de corte, y clic en un elemento para ver su ficha con todas las propiedades del IFC.
- Pestañas con datos que salen del propio IFC: Metrados (cantidades por sistema y tipo), Calidad (porcentaje de elementos con tipo, material, fase y cantidades, y propiedades por elemento) y Corte. Casa Violeta se exportó en IFC2X3 y trae poca información; la pestaña Calidad lo dice tal cual.
- Los 10 IFC originales suman 164 MB (de 4 a 44 MB cada uno); empaquetados para la web suman 2.1 MB (de 44 a 638 KB cada uno): geometría cuantizada y simplificada por elemento, con el entorno recortado a 5 m del edificio.
- Se quitaron el visor antiguo de Casa Violeta (`viewer.js`, `casa-violeta.glb`, `casa-violeta-bim.json`) y los textos «en preparación». Herramientas: Autodesk Construction Cloud en lugar de BIM 360.
- Estilos nuevos al final de `src/v30.css` (prefijo `bx`).

## Novedades v2.3 (tanda 3b: Obra)
- La ventana Obra pasa a cuatro cajetines seleccionables (pestañas con flechas de teclado): Alpes 2, Las Lagunas, Tiendas 3A y Monte Alegre. Cada ficha: cajetín (cargo, empresa, lugar), cifras, visual propio, Alcance, Lo que exigió y, si hay, registro fotográfico con ampliación.
- Alpes 2: 24 departamentos (cuadrícula numerada interactiva), tabla por departamento y total (144 ml, 144 puertas, 360 m², derivados). Las Lagunas: 4 viviendas con barras de área construida a escala (1,275 m² derivado), con «metrados para valorizaciones» tomado del CV. Tiendas 3A: tira de 11 días y seis partidas. Monte Alegre: 23 baños, 9 departamentos, 2,981 m² con la cuadrícula de enchape.
- 15 fotografías nuevas en `public/img`: `ob-lag-1..9` (Las Lagunas: muro de contención y encofrado de techo de la casa 3, una piscina por casa, y tres de la primera selección; rostros difuminados) y `ob-ma-1..6` (Monte Alegre, sin rótulos de fecha/dirección/GPS). Alpes 2 y Tiendas 3A siguen sin fotos (pendiente de Alex). Dato de la casa 3: luz de 7.8 m en la sala.
- Estilos nuevos al final de `src/v30.css` (prefijo `ox`); lógica en el bloque «02 · Obra» de `src/main.js`.

## Novedades v2.2 (tanda 3a: Presupuestos, Diseño, Concursos, Docencia)
- Entra `src/v30.css` (última capa): cajetines, hojas apiladas, pasos, ejes, tabla de correlaciones, desplegable y pizarra de Revit I en el sistema plano.
- **Presupuestos:** el +68.1% se redacta como «metrado ejecutado sobre el contractual, validado con el as-built modelado en BIM» (ventana, barra, leyenda y tarjeta del índice).
- **Diseño:** frase nueva; se retira el proyecto Tuquillo (y su JS); los ocho ejes se animan al entrar a la vista (`#tens`, botón `#tensRp`); «Del cuaderno» en tres láminas planas.
- **Concursos:** la tabla de correlaciones suma «explica» (r al cuadrado) y una lectura propia por factor; bloque «Lectura de conjunto». Sin tamaño de muestra de fotografías (sin confirmar).
- **Docencia:** lista desplegable (`#acc`, `.ac`) con Revit I (pizarra de 7 sesiones, cajetín de datos), Creatividad 01 y ESAN (solo lo confirmado en el CV). Se quitan las cajas «por seleccionar».
- Pendiente: Obra (tanda 3b) y BIM (tanda 3c).

## Novedades v2.1 (tanda 2)
- Se retira la capa de vidrio (`src/glass.css` deja de importarse) y entra `src/v20.css`: papel liso, tinta, rojo como único acento, esquinas rectas y líneas de 1 px. Sin desenfoques, sin grano y sin letra manuscrita en esta parte de la página.
- Barra superior plana (nombre en Cormorant cursiva, enlaces en Barlow Condensed, subrayado rojo en el activo); sigue transparente sobre la portada. Botones con borde de 1 px que se rellenan de tinta al pasar el cursor; el principal (`.cta`) va en tinta y pasa a rojo. Se quitan la pluma, la onda, la atracción magnética y el reflejo de «cristal» (`main.js`).
- **Quién soy** pasa a una plancha de tres hojas (Perfil, Trayectoria, Formación y herramientas) con el número de hoja arriba a la derecha (`#qno`, actualizado por las pestañas). El Perfil lleva la frase y dos párrafos cortos, y en el cajetín los valores **Rigor, Trazabilidad y Control**. Se retiran la foto de fondo y la tira de papel rasgado.
- Las seis tarjetas de **Mi trabajo** son hojas de índice: «Hoja 0X / 06» y el nombre del frente arriba, miniatura, título, una línea y «Abrir ventana». Se quitan las líneas «Valida:» (siguen dentro de cada ventana) y los rótulos manuscritos.
- El contacto pasa a fondo liso (sin fotografía); su rediseño es de la tanda 4.
- Tipografías: se sirven desde el propio paquete (`@fontsource`). Se añade Cormorant Garamond 500 y 500 cursiva, que el diseño ya pedía.
- Corrección: las cruces de registro de la plancha del Método compartían nombre con la línea de tiempo (`.tl`) y la superior izquierda salía desplazada.
- Las ventanas abiertas conservan por ahora su estilo anterior (se migran en la tanda 3).

## Novedades v2.0 (tanda 1)
- Método en cinco etapas: se suma **05 Entrega** con la foto de la estructura sin operarios (`puck-obra-1.webp`), cuatro datos de la obra y el sello «Ejecutada · febrero de 2023» (antes en la etapa 4). La foto con operarios (`puck-obra-4.webp`) ya no se usa en la página. `initEtapas` en `src/portada.js` toma el número de etapas de las hojas (`.pl-st`); el recorrido fijo mide 750 px por etapa.
- Se retiraron las dos fotos sueltas bajo el Método (`.et-obra`) y sus reglas.
- «¿Qué necesitas validar?» pasa a **Mi trabajo**, con subtítulo más corto.
- La foto del paisaje lleva «Primero el lugar, después la forma.» en Cormorant cursiva (sin letra manuscrita).
- Pendiente de las siguientes tandas: aplicar la línea del Método al resto de la web, quitar la letra manuscrita y las fotos de niebla, rediseñar «Cuéntame tu proyecto» y la versión de producción sin notas.

## Novedades v1.9
- La pila de hojas deja asomar el encabezado de cada una (Hoja 01 a 04) mientras entra la siguiente, y el pase funciona desde ventanas de 720 × 480 px (antes 861 × 560).
- Método: vuelve el pase de hojas dentro de la plancha. Cada etapa es una hoja con cinta que entra volando desde abajo a la derecha, rotada, se asienta y queda apilada bajo la siguiente. Las imágenes entran con zoom y desplazamiento; en la etapa 4 los planos entran por la izquierda y las fotos por la derecha, y el sello cae con rebote. Se quitó el barrido de línea roja. El pase de hojas ya no depende de «reducir animaciones» del sistema: avanza con tu scroll. `src/portada.js`, `src/v12.css`.

## Novedades v1.8
- Método en una sola plancha fija: el cajetín del encargo a la derecha (título, tres cifras que cuentan desde cero, una frase, mi rol, las cuatro etapas y una ficha desplegable) y a la izquierda las cuatro hojas, que entran desde abajo, giran un poco y se asientan una sobre otra en cascada, con su cinta y su encabezado (Hoja 1 de 4…). Se retiraron el encabezado largo, la ficha de seis celdas, el riel vertical y las hojas apiladas. `src/portada.js`, `src/v12.css`.
- Etapa 4: cada plano frente a su foto de obra, con el par marcado en rojo, y el sello «Ejecutada · febrero de 2023».
- Móvil: el cajetín primero y cada etapa debajo, con una línea roja que se dibuja al entrar; la ficha se despliega bajo el botón.
- Paleta única en toda la web: se quitaron el turquesa, el verde, el azul cobalto y los violetas. Quedan tinta `#14181C`, grises fríos y el rojo `#C8402F` como único acento (tokens en `src/style.css`; también en el visor 3D, los dibujos de las ventanas y las anotaciones a mano). Los dibujos del Método se ven en escala de grises; las fotos de obra conservan su color.

## Novedades v1.7
- Método con la paleta de la portada: papel gris frío, líneas en tinta y el rojo solo en la etapa activa, las marcas de avance y la línea de calco. Sin tarjeta de vidrio.
- El texto abre con el resultado (12 m de alto, 3 toneladas, febrero de 2023), sigue el encargo y una ficha al inicio: obra, escuela, rol, alcance, plazo y recursos, y equipo. La cubierta aparece solo en Alcance, como proyecto aparte de la administración de Puckllay.
- Las pestañas se cambiaron por un riel vertical a la derecha, con el mismo lenguaje que la barra de la portada.
- Etapa 4: al pasar el cursor por un plano se marca su foto de obra (DET03 y DET05); al llegar a la etapa se marcan una vez cada par.

## Novedades v1.6
- Portada sin franja inferior: la primera pantalla termina en el modelo, el nombre y la barra vertical; la tira de papel rasgado entra directo al Método, sin escritura.
- El crédito del modelo (Bienestudio y modelado BIM) aparece como segunda línea del pie solo cuando el modelo está abierto.
- Ventana 03: ficha con Obra, Empresa y Comitente (Congreso de la República, Unidad Ejecutora de la Bicameralidad).
- Se retiraron la frase de presentación, "Rigor · Trazabilidad · Control", los dos botones de la franja y el conteo de cifras de la portada.

## Novedades v1.5
- Portada: papel frío `#EDEFF0`, modelo 3D central en grises, rojo de obra `#C8402F` solo en el nivel resaltado.
- Entrada del modelo: líneas que suben y se rellenan de masa, una vez por carga (sin texto).
- Una sola herramienta: barra vertical que abre el modelo en cuatro niveles; con el modelo abierto, el cursor aísla un nivel y muestra su nombre.
- Barra superior mínima ("Menú") mientras se ve la portada; cifras y párrafo bajaron a una franja bajo la portada.
