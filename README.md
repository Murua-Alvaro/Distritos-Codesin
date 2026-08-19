# Distritos CODESIN · Mazatlán

Mapa web estático listo para **GitHub Pages** con la regionalización corregida de AGEBS por 13 distritos.

## Estado de los datos

- **13 distritos CODESIN**
- **295 AGEBS con geometría**
- **295 CVEGEO únicas**
- **0 asignaciones duplicadas entre distritos**
- **100% de las 295 AGEBS de la capa corregida tienen distrito**

Fuente cartográfica de esta compilación: `AGEB dividida por polígonos CORREGIDO (1)(2).zip`.

> Importante: esta versión deliberadamente no mezcla indicadores DENUE, empleo o SCIAN que no vienen dentro del ZIP fuente. La carpeta `data/ageb_distrito.csv` queda preparada como llave para unir posteriormente información económica por CVEGEO.

## Archivos

- `index.html` — interfaz principal.
- `styles.css` — diseño responsive.
- `app.js` — mapa, filtros, búsquedas y paneles.
- `data/distritos.geojson` — 13 geometrías distritales disueltas.
- `data/agebs.geojson` — 295 AGEBS con distrito, superficie y centroide.
- `data/stats.json` — indicadores de control y estadísticas por distrito.
- `data/ageb_distrito.csv` — tabla de membresía para auditoría y cruces.
- `.nojekyll` — evita transformaciones de Jekyll en GitHub Pages.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube **el contenido de esta carpeta** a la raíz del repositorio.
3. En GitHub ve a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona `main` y carpeta `/ (root)`.
6. Guarda. GitHub publicará el sitio automáticamente.

## Probar localmente

No abras `index.html` directamente como `file://`, porque el navegador puede bloquear los `fetch()` de GeoJSON. Usa un servidor local, por ejemplo:

```bash
python -m http.server 8000
```

y entra a `http://localhost:8000`.

## Metodología

Las entidades vacías del shapefile original se excluyen. Las áreas se calculan reproyectando temporalmente a **EPSG:32613 (UTM 13N)**. Para navegación web las geometrías se simplifican levemente (2–3 m) manteniendo topología.

Generado como versión de control territorial para Mazatlán.
