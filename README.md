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
- **Conselva · Riesgo climático:** nuevo modo en Desarrolladores con un selector de ocho mapas públicos (inundaciones, laderas, erosión, marea de tormenta, exposición de población e infraestructura, vulnerabilidad sectorial y socioambiental). Los mapas externos se consultan desde su servidor con visualización incrustada cuando está permitida; siempre se muestra un enlace directo de respaldo.
- **Conselva · Resultados:** se citan cifras agregadas del [Estudio de Vulnerabilidad Socioambiental de Mazatlán](https://conselva.org/estudio-de-vulnerabilidad/) y se ofrece el [documento técnico](https://conselva.org/wp-content/uploads/2025/11/Optimizado-digital-FMCN-Vulnerabilidad-Mazatlan.pdf). Es una integración de consulta: sin acceso confirmado a API geográfica pública, no se hacen intersecciones con AGEB/DENUE ni se redistribuyen polígonos del estudio.

**Entrada directa:** `/desarrolladores.html`. Si GitHub Pages está configurado para la rama principal, la ruta del proyecto suele ser `https://murua-alvaro.github.io/Distritos-Codesin/desarrolladores.html`.

**Control:** mantener la separación entre densidad poblacional observada 2020 y densidad de negocios DENUE 2025. Los parámetros IMPLAN no son polígonos de uso del suelo.

## Interoperabilidad de datos abiertos — actualización del 19 de noviembre de 2026

La sección **Desarrolladores** sigue siendo una única página, conectada a los mismos archivos oficiales del atlas. Esta actualización incluye:

1. **Actividad económica:** modo de mapa de densidad DENUE (mayo 2025) con fichas de AGEB. El universo municipal es 26,950 establecimientos; la membresía de los 13 distritos comprende 25,422, y los 1,528 restantes no se asignan por proximidad.
2. **Importación vectorial en el navegador:** GeoJSON (FeatureCollection o Feature) y CSV de puntos con columnas `LATITUD` y `LONGITUD` en WGS84, con 5,000 geometrías y 8 MB como límites de carga. El programa no incorpora datos ficticios. Admite archivos de obras o infraestructura **solo cuando el usuario disponga de geometrías georreferenciadas legítimas**.
3. **GeoJSON por URL:** carga de documentos públicos HTTPS que permitan acceso entre orígenes (CORS). Los errores de origen, formato y descarga se presentan al usuario sin reemplazar la capa previa.
4. **WMS:** agrega teselas de un servicio OGC bajo una URL HTTPS y un nombre de capa válido. El endpoint de INEGI se presenta como referencia documentada; el usuario debe seleccionar una capa de `GetCapabilities`. Una capa WMS representa imágenes, no atributos geográficos aptos para sumar o intersectar.
5. **Cruce vectorial:** cuando se carga Turf.js, el visor cuenta las geometrías GeoJSON que intersectan la AGEB seleccionada; el cálculo está limitado a 2,000 geometrías para evitar bloquear el navegador. Es una coincidencia geométrica exploratoria, no un análisis de áreas afectadas ni un dictamen normativo o climático.
6. **Información territorial:** resumen por distrito y fichas con área, negocios y población 2020 únicamente si CONAPO o INEGI ha sido incorporado. Se explicita la cobertura y se exporta un CSV con datos faltantes en blanco.
7. **Conselva:** el visor institucional sigue siendo externo, pero se muestra de forma flotante junto al mapa nativo. No se descargan sus polígonos, no se inventan riesgos por AGEB ni se redistribuyen sus datos protegidos.

### Fuentes y límites

- [INEGI, catálogo de servicios WMS](https://www.inegi.org.mx/servicios/wsinfogeo/).
- [IMPLAN Mazatlán, instrumentos de planeación](https://www.implanmazatlan.mx/instrumentos).
- [Ayuntamiento de Mazatlán, ecosistema digital y sistema municipal de obras](https://tics.mazatlan.gob.mx/ecosistema-digital/). El portal documenta ubicación e inversión en obras, pero no se ha verificado una fuente descargable geográfica ni una API pública del micrositio.
- [Conselva, Explorador de Vulnerabilidad Socioambiental](https://conselva.org/mapa-vulnerabilidad/) y [estudio técnico](https://conselva.org/estudio-de-vulnerabilidad/).

### Comprobación funcional sugerida

- Abrir `desarrolladores.html` y comprobar que aparecen las 295 AGEB, los 13 distritos y la nueva opción «Actividad económica · DENUE».
- Seleccionar una AGEB, observar el panel conjunto y exportar el CSV.
- Importar GeoJSON de prueba con 1 punto y 1 polígono sobre Mazatlán; verificar ficha de atributos y cruce, si está disponible Turf.js.
- Importar CSV con encabezados `LATITUD,LONGITUD` y confirmar que filas sin coordenadas se descartan.
- Probar una URL GeoJSON con CORS y un WMS válido; un servicio que no responda debe presentar advertencia.
- Abrir el visor de Conselva y confirmar que se puede cerrar sin perder el mapa y las capas del entorno.
- Verificar la publicación efectiva en el servidor. Este repositorio es estático y **no dispone de controles CI de despliegue comprobados**; una validación estática de JavaScript no sustituye pruebas en navegador.

