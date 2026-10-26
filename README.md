# LUMINA-WEB · Casas en Funes

Sitio web de **Lumina** (14 casas en Funes, Santa Fe · desarrolla ZLT).
Estructura base tomada de ZLT-WEB-V2 (barra de 64 px, wrap de 1200 px, breakpoints 480/640/860/900, pares bilingües `.l-es` / `.l-en`, tags de estado de obra), con el branding y los recursos de Lumina.

## Qué se publica

`dist/index.html` → **un solo HTML autocontenido** (fotos, videos, brochures, logos, tipografía, CSS y JS embebidos en base64). Se sube tal cual a GitHub Pages. Pesa ~24 MB (límite de subida: 30 MB).

Por defecto el sitio sale con `noindex` (no compite en Google con luminafunes.com hasta que se haga la mudanza). Para habilitar la indexación: `node build.js --index`.

Publicado en https://conradoremyzlt.github.io/REPO-WEB-LUMINA/ — `.github/workflows/pages.yml` publica `dist/index.html` en cada push a `main` (correr `node build.js` antes de subir). Por ahora lleva login: inserta `gate.js` (copia exacta del de ZLT-WEB-V2, mismos usuarios) después de `</title>`. Si cambian los usuarios allá, copiar el archivo de nuevo. Es un login del lado del navegador: frena a quien entra por la URL, no a quien lea el repo. Para sacarlo: borrar el bloque "Login" del workflow.

## Cómo se trabaja

Requisito: Node 16 o superior (sin dependencias).

```
node build.js          # genera dist/index.html (lo que se publica)
node build.js --dev    # genera preview.html, apunta a los archivos del repo (para editar y ver rápido)
node build.js --index  # igual que el primero, pero indexable
```

Se edita siempre en `src/`, `links/` y las carpetas de recursos; nunca a mano `dist/index.html`.

## Carpetas

| Carpeta | Contenido |
|---|---|
| `src/html/index.html` | Plantilla de la página (todos los textos, ES y EN) |
| `src/css/styles.css` | Estilos y tokens de marca |
| `src/js/main.js` | Idioma, galerías, tipologías, masterplan, avance de obra, formulario |
| `src/data/obra.json` | **Estado de obra**: % por etapa, trabajos en curso, fotos y video del último relevamiento |
| `src/data/unidades.json` | Tipologías (superficies) y los 14 lotes (tipología, etapa, superficie y posición en el masterplan) |
| `links/links.json` | WhatsApp, mail, Instagram, dirección, mapa y webs de los socios |
| `fotos/` | `renders/`, `obra/AAAA-MM/`, `plantas/`, `masterplan/` (WebP optimizados) |
| `videos/` | Loop del predio (animación) y video de avance de obra |
| `brochures/` | Brochure ES (vigente 27/06/25) y EN |
| `logos/` | Lumina, ZLT, Qala, Crestale y Jauke en SVG (toman el color con `currentColor`) |
| `iconos/` | Íconos de línea en SVG y favicon |
| `fonts/` | Tipografía web (ver nota de licencias) |
| `tools/` | Scripts para regenerar fotos y logos desde las carpetas originales |

## Actualizar el avance de obra (cada informe de Jauke)

1. En `src/data/obra.json`: cambiar `porcentajes.fecha` y el `avance` de cada etapa con los % que manda Franco Scaglione (no se calculan).
2. Próximas tareas de cada etapa: `trabajos_es` / `trabajos_en` y `tareas.mes` (mes para el que están programadas) (salen de "Tareas programadas" del informe).
3. Fotos nuevas: WebP en `fotos/obra/AAAA-MM/` (sin agrandar las del informe) y agregarlas al principio de `galeria` con su `fecha` y epígrafe ES/EN. Video: en `video` (H.264, 960 px, 60 fps).
4. `node build.js` y publicar `dist/index.html`.

Etapas: **Etapa 1** casas 1–6 · **Etapa 2** casas 7–9 · **Etapa 3** casas 10–14.

## Regenerar recursos desde los originales

```
python tools/optimize_assets.py "<ruta a Girasoles - Comunicación y Marketing>" "<brochure VF 17 MB>"
python tools/logos.py "<ruta a Girasoles - Comunicación y Marketing>"
```

Reglas: `exif_transpose` antes de escalar, LANCZOS, nunca deformar; PNG con alfa sin `optimize=True`.

## Fuentes de los datos

- Textos, características, terminaciones y tipologías: brochure digital vigente (27/06/25) y su versión en inglés.
- Superficie de cada lote: plano de numeración de casas de Jauke (SUP03).
- % de avance por etapa: mail de Jauke (junio 2026). Próximas tareas y fotos de obra: informe de Jauke de septiembre 2026 (19/10/2026).
- Vistas aéreas y video de obra: relevamiento de mayo 2026.

## Pendientes / a confirmar

- **Tipografía**: la marca usa Neue Montreal, pero la copia del manual es la versión *free demo* (uso personal). El sitio usa **Hanken Grotesk** (licencia OFL, libre). Si se compra la licencia web de Neue Montreal, reemplazar los `.woff2` en `fonts/` y las 3 reglas `@font-face` al inicio de `styles.css`.
- **Logo de Qala**: vectorizado a partir de una imagen chica del brochure. Conviene reemplazarlo por el archivo oficial.
- **Superficie del predio**: el brochure dice 4.000 m²; la ficha técnica, 3.884 m².
- **Brochure EN**: es la traducción de abril 2025 (anterior a la versión ES vigente).
- El formulario no tiene backend: abre WhatsApp con la consulta armada.
