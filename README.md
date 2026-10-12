# España, en datos

Landing estática en **Astro** que compara indicadores oficiales de España desde el
1 de junio de 2018, con una regla editorial simple: **solo se publica un dato si se ha
verificado en una fuente primaria y se puede comparar consigo mismo.**

El proyecto sigue las instrucciones de [`AGENT.md`](./AGENT.md).

## Comandos

```bash
npm install
npm run dev        # servidor de desarrollo
npm run check      # astro check (TypeScript + plantillas)
npm run typecheck  # tsc --noEmit
npm run build      # genera dist/
npm run preview    # sirve dist/
```

Antes de publicar hay que ejecutar `npm run check` y `npm run build`: ambos deben salir
sin errores.

## Estructura

```
src/
  types.ts                  Tipos del modelo de indicadores (ficha obligatoria)
  data/
    indicators.ts           ÚNICA fuente de verdad: series, fuentes y textos
    site.ts                 Metadatos del sitio y lista de indicadores excluidos
    timeline.ts             Hitos del periodo con fuente primaria
  lib/
    indicators.ts           Validación, derivación de valores y formato
  components/               Componentes Astro reutilizables
  layouts/BaseLayout.astro  Head, SEO, datos estructurados
  pages/                    index, metodología, ficha por indicador, RSS, 404
  styles/global.css         Tokens `@theme` + capa base de Tailwind v4
```

## Estilos

Todo el estilo es **Tailwind CSS v4**, integrado con el plugin oficial
`@tailwindcss/vite` registrado en `astro.config.mjs`. No hay configuración
de Tailwind aparte: el CSS se genera desde las plantillas `.astro`.

`src/styles/global.css` es el único archivo de estilos del proyecto y
contiene tres cosas:

1. **`@theme`** — el sistema de diseño como tokens. A partir de ahí
   Tailwind genera las utilidades (`text-ink`, `border-rule`, `bg-accent`,
   `font-display`, `text-title`, `rounded-shell`…). Cambiar un color o una
   escala tipográfica se hace una sola vez, en ese bloque.
2. **`@layer base`** — solo valores por defecto de elemento: reset de
   `box-sizing`, tipografía del `body`, jerarquía de encabezados, enlaces,
   foco visible y `prefers-reduced-motion`.
3. **Utilidades compuestas** — patrones que se repiten en varios
   componentes: `page-shell`, `section-block`, `data-cell`, `chip`,
   `plate`/`plate-core` (doble bisel), `button`…

### Tema oscuro y claro

El sitio se publica en **oscuro por defecto**, con un interruptor en la
cabecera que conmuta al tema claro. La preferencia se guarda en
`localStorage` bajo la clave `tema`.

- Los tokens se declaran dos veces: en `@theme` (oscuro) y en
  `:root[data-theme='light']` (claro). Ningún componente escribe un hex.
- `src/layouts/BaseLayout.astro` lleva un script en línea y síncrono que
  aplica la preferencia guardada **antes de pintar**. Sin él se vería un
  destello del color contrario en cada carga.
- `src/components/ThemeToggle.astro` es el interruptor: un `<button>` con
  `aria-pressed` y `aria-label`, que además sincroniza `color-scheme` para
  que el `select` y la barra de desplazamiento sigan al tema.
- Al conmutar se emite `tema:cambiado`. Las gráficas lo escuchan, leen los
  tokens otra vez y se recrean: Chart.js no admite cambiar su paleta en
  sitio.

Los pares de color se verificaron a WCAG AA en los dos temas. El más
ajustado es `rise` sobre `rise-bg` en tema claro, con 4,95:1.

### Reglas de composición

- Un componente se construye con utilidades en su plantilla. No se admite
  un bloque `<style>` dentro de un `.astro`.
- Las tarjetas relevantes usan **doble bisel**: `plate` es la bandeja
  (borde exterior, radio `2rem`) y `plate-core` la chapa interior, cuya
  curva es la de la bandeja menos el grosor del bisel.
- Los estados interactivos se expresan con variantes de ARIA
  (`aria-pressed`) para que el estilo no dependa de que JavaScript altere
  clases.
- Todas las transiciones usan curvas propias (`cubic-bezier`). Nada de
  `linear` ni `ease-in-out`.
- Los tokens `rise` y `fall` no se usan nunca solos: la etiqueta de
  tendencia los combina con flecha y con la palabra (`sube`, `baja`,
  `recorrido irregular`).


## Modelo de datos

Cada indicador declara en `src/data/indicators.ts`:

- `baselinePeriod` y `currentPeriod`: los dos periodos comparados, con etiqueta exacta.
- `series.es` y `series.eu`: la serie completa, no solo los extremos.
- `source`: dataset, filtros aplicados, enlace a la tabla y fecha de actualización en la fuente.
- `methodology`, `context`, `reading`, `trend`, `status`.

`lib/indicators.ts` deriva `baselineValue`, `currentLabel`, etc. **a partir de la serie**.
Si un periodo declarado no existe en la serie, la compilación falla en lugar de publicar
un hueco: no es posible que la tarjeta, la tabla y la gráfica muestren cifras distintas.

## Regla de comparación de periodos

| Frecuencia de la serie | Periodo inicial | Motivo |
| --- | --- | --- |
| Anual | 2017 | Último año completo publicado antes del 1 de junio de 2018 |
| Mensual | mayo de 2018 | Último mes cerrado antes del 1 de junio de 2018 |
| Trimestral | 1.er trimestre de 2018 | Último trimestre cerrado antes del 1 de junio de 2018 |

El periodo actual es el último publicado en la fecha de revisión y **no coincide entre
series**. La página nunca usa «antes» ni «ahora».

## Proceso de actualización de datos

Las cifras se verifican contra la API de difusión de Eurostat y se incrustan en el
repositorio. El sitio no hace scraping en el navegador ni llama a ninguna API en tiempo de
ejecución.

```bash
# 1. Consultar la serie con los filtros declarados en la ficha
curl "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/une_rt_m?format=JSON&geo=ES&sex=T&age=TOTAL&unit=PC_ACT&s_adj=SA&sinceTimePeriod=2018-01"
```

1. Descargar la serie desde la API con los filtros que figuran en `source.selection`.
2. Sustituir la serie correspondiente en `src/data/indicators.ts` (y la de la UE si existe).
3. Actualizar `baselinePeriod` / `currentPeriod` si procede y `DATA_REVIEWED_AT`.
4. Actualizar `source.datasetUpdatedAt` con la fecha `updated` que devuelve la API.
5. Revisar `methodology` y `context` si la revisión estadística afecta a la comparación.
6. Ejecutar `npm run check` y `npm run build`. La compilación falla si algún periodo
   declarado no existe en la serie.
7. Registrar el cambio en `src/pages/actualizacion.xml.ts`.

## Indicadores excluidos

`src/data/site.ts` lista los temas considerados y **no publicados**, con el motivo. La regla
es explícita: ante un dato no comparable, se muestra la limitación o se deja fuera.

## Antes de desplegar

- Sustituir `https://indicadores-espana.example.org` por el dominio real en
  `astro.config.mjs`, `src/data/site.ts` y `public/robots.txt`.
- Confirmar la entidad responsable y la dirección de contacto.