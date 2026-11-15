# Distritos CODESIN · Mazatlán

Mapa estático listo para GitHub Pages con la regionalización corregida de los 13 distritos CODESIN de Mazatlán y lectura económica DENUE 05/2025.

## Qué incluye

- 13 distritos CODESIN.
- 295 AGEB únicas, sin duplicaciones de membresía.
- 25,422 establecimientos DENUE asignados a la regionalización.
- 26,950 establecimientos en el universo municipal.
- Cobertura CODESIN: 94.33%.
- 1,528 registros DENUE fuera de la membresía CODESIN, conservados sin reasignar.
- Vista por distrito y por AGEB.
- Búsqueda por distrito o CVEGEO.
- Ranking por establecimientos, establecimientos/AGEB, establecimientos/km² y HHI.
- Ficha de distrito con stock, participación CODESIN, participación municipal, AGEB activas, intensidad, densidad física, clases SCIAN, HHI, estructura por tamaño, top 5 sectores y especializaciones LQ.
- Ficha AGEB con establecimientos, superficie, densidad física, clases SCIAN, microunidades y sectores principales.

## Archivos principales

```text
index.html
styles.css
app.js
.nojekyll
DATA_AUDIT.md
data/
  distritos.geojson
  agebs.geojson
  stats.json
  economic_stats.json
  ageb_distrito.csv
  district_economic_summary.csv
  ageb_economic_summary.csv
  outside_codesin_2025.csv
```

## Fuentes

- Regionalización: `AGEB dividida por polígonos CORREGIDO (1)(2).zip`.
- Fuente económica: `DENUE_Mazatlan_2025_completo.csv`, corte 05/2025.
- Documento de control: `EDA_Economico_Distritos_CODESIN_Mazatlan_DENUE_2025(1).docx`.

## Denominadores

La participación CODESIN usa 25,422 establecimientos como denominador. La participación municipal usa 26,950. Los 1,528 registros fuera de la membresía no se asignan por proximidad.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube **el contenido de esta carpeta a la raíz del repositorio**.
3. Abre `Settings → Pages`.
4. Selecciona `Deploy from a branch`.
5. Selecciona `main` y `/(root)`.
6. Guarda.

No requiere build, Node, backend ni base de datos.

## Nota técnica

Leaflet se carga desde CDN y el mapa base utiliza CARTO/OpenStreetMap. Por eso el sitio debe abrirse mediante GitHub Pages o un servidor HTTP; abrir `index.html` directamente como archivo local puede impedir la carga de los JSON por restricciones del navegador.

## Desarrolladores · Cartografía urbana

La página `desarrolladores.html` está enlazada desde el menú superior y la barra izquierda de `index.html`, dentro del mismo sitio CODESIN.

- **Huella urbana:** consulta de teselas de MapBiomas México por año; requiere disponibilidad externa de su API y CORS. No hay un raster satelital en este repositorio.
- **Densidad de población:** carga pública bajo demanda de CONAPO 2020 por AGEB o importación manual del CSV/ZIP de INEGI; los datos faltantes nunca se sustituyen por cero.
- **Densidad de viviendas:** importación del Censo INEGI 2020, sin datos inventados.
- **IMPLAN:** consulta de 14 categorías de parámetros urbanísticos. No equivale a geometría oficial de zonificación.
- **Cartografía:** reutiliza `data/agebs.geojson` (295 polígonos), `data/distritos.geojson` (13 polígonos) y `data/economic_stats.json`, sin clonar ni modificar sus registros.

**Entrada directa:** `/desarrolladores.html`. Si GitHub Pages está configurado para la rama principal, la ruta del proyecto suele ser `https://murua-alvaro.github.io/Distritos-Codesin/desarrolladores.html`.

**Control:** mantener la separación entre densidad poblacional observada 2020 y densidad de negocios DENUE 2025. Los parámetros IMPLAN no son polígonos de uso del suelo.
