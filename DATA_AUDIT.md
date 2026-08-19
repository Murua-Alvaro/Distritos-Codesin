# Auditoría de datos · CODESIN Mazatlán

## Regionalización

- Distritos: **13**
- AGEB con geometría: **295**
- CVEGEO únicas: **295**
- Duplicaciones de membresía: **0**
- Suma de AGEBS de los 13 distritos: **295**

## DENUE 05/2025

- Universo municipal: **26,950** establecimientos
- Asignados a la membresía CODESIN: **25,422**
- Cobertura económica: **94.33%**
- Fuera de membresía: **1,528** (**5.67%**)
- AGEB CODESIN con al menos un establecimiento: **262**
- Códigos AGEB con registros DENUE fuera de CODESIN: **40**

## Validación de indicadores

`data/economic_stats.json` fue contrastado contra la tabla maestra del EDA económico de distritos. Para los 13 distritos no se detectaron diferencias en:

- establecimientos;
- AGEB asignadas;
- participación CODESIN;
- establecimientos por AGEB;
- clases SCIAN;
- HHI sectorial;
- porcentaje de unidades de 0 a 10 personas.

## Casos territoriales revisados

- `2501200011527` → **Jabalíes - Zapata**
- `2501200011796` → **Conchi - Libramiento**

## Regla de cobertura

Los 1,528 establecimientos fuera de la membresía CODESIN se mantienen como **fuera de regionalización CODESIN**. No deben reasignarse automáticamente al distrito más cercano.

## Archivos de auditoría

- `data/ageb_distrito.csv`: relación CVEGEO–distrito–geometría.
- `data/district_economic_summary.csv`: indicadores principales de los 13 distritos.
- `data/ageb_economic_summary.csv`: resumen económico de las 295 AGEB.
- `data/outside_codesin_2025.csv`: 40 códigos AGEB fuera de la membresía y sus 1,528 registros.
