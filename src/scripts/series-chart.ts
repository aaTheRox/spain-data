/**
 * Renderizado de la serie de un indicador con Chart.js.
 *
 * Módulo de **solo cliente**. Lo consumen tanto el explorador de la portada
 * como la ficha de cada indicador, de modo que existe una única definición de
 * cómo se dibuja una serie: si se toca el estilo, el tooltip o el manejo de
 * huecos, cambia en los dos sitios a la vez.
 *
 * Las etiquetas de periodo se calculan aquí y no importando `lib/indicators`:
 * ese módulo arrastraría `data/indicators.ts` completo al paquete del
 * navegador. El formateo vive duplicado a propósito, con estas reglas:
 * - `periodLabel` (servidor) devuelve «mayo de 2018», «primer trimestre de…».
 * - `long`/`short` (cliente) devuelven lo mismo para ejes y tooltips.
 */

export interface SeriesPoint {
  period: string;
  value: number;
}

/** Subconjunto de un indicador que la gráfica necesita. */
export interface SeriesPayload {
  id: string;
  title: string;
  category: string;
  unit: string;
  decimals: number;
  baselinePeriod: string;
  currentPeriod: string;
  /** Enlace a la tabla oficial, para el enlace de fuente de la figura. */
  sourceUrl: string;
  /** Nombre corto de la fuente, para el texto del enlace. */
  sourceShort: string;
  es: SeriesPoint[];
  eu: SeriesPoint[] | null;
}

export type ChartView = 'line' | 'bar';

export interface ChartState {
  view: ChartView;
  compareEu: boolean;
}

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const shortPeriod = (period: string): string => {
  const quarter = /^(\d{4})-Q([1-4])$/.exec(period);
  if (quarter?.[1] && quarter[2]) return `${quarter[1]} T${quarter[2]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month?.[1] && month[2]) {
    return `${MONTHS[Number(month[2]) - 1]?.slice(0, 3)} ${month[1]}`;
  }
  return period;
};

export const longPeriod = (period: string): string => {
  const quarter = /^(\d{4})-Q([1-4])$/.exec(period);
  if (quarter?.[1] && quarter[2]) return `Trimestre ${quarter[2]} de ${quarter[1]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month?.[1] && month[2]) return `${MONTHS[Number(month[2]) - 1]} de ${month[1]}`;
  return period;
};

export const formatValue = (value: number, decimals: number): string =>
  value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Paleta de la gráfica. NO está fijada en el código: se lee de las variables
 * CSS del tema activo, de modo que la gráfica acompaña al interruptor
 * oscuro/claro sin necesidad de una segunda paleta.
 *
 * `--color-rise` es el acento de la serie española; `--color-accent` dibuja
 * la serie de la UE; los grises salen del sistema de superficies.
 */
const readPalette = () => {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  const rise = token('--color-rise', '#5fd3b0');
  return {
    es: rise,
    esFill: `color-mix(in srgb, ${rise} 14%, transparent)`,
    eu: token('--color-accent', '#e8e4d9'),
    barBefore: token('--color-rule-strong', '#333c4a'),
    barAfter: rise,
    grid: token('--color-rule', '#222833'),
    text: token('--color-muted', '#8f9bab'),
    heading: token('--color-ink-soft', '#c7cfda'),
    font: 'Plus Jakarta Sans',
  };
};

const euIndex = (payload: SeriesPayload): Map<string, number> =>
  new Map((payload.eu ?? []).map((point) => [point.period, point.value]));

const at = (points: SeriesPoint[], period: string): SeriesPoint | undefined =>
  points.find((point) => point.period === period);

/**
 * Construye los datos de la gráfica.
 *
 * En vista `bar` solo se dibujan dos barras: el periodo inicial y el actual,
 * con su etiqueta exacta. Nunca se mezclan indicadores ni unidades distintas
 * en un mismo eje.
 */
export function buildChartData(payload: SeriesPayload, state: ChartState) {
  const colors = readPalette();
  const euOn = state.view === 'line' && state.compareEu && Boolean(payload.eu);

  if (state.view === 'bar') {
    const before = at(payload.es, payload.baselinePeriod);
    const after = at(payload.es, payload.currentPeriod);
    return {
      geoOn: false,
      data: {
        labels: [
          `${longPeriod(before?.period ?? '')} (inicial)`,
          `${longPeriod(after?.period ?? '')} (actual)`,
        ],
        datasets: [
          {
            label: 'España',
            data: [before?.value ?? 0, after?.value ?? 0],
            backgroundColor: [colors.barBefore, colors.barAfter],
            borderRadius: 3,
          },
        ],
      },
    };
  }

  const eu = euIndex(payload);
  type Row = Record<string, unknown>;
  const datasets: Row[] = [
    {
      label: 'España',
      data: payload.es.map((point) => point.value),
      borderColor: colors.es,
      backgroundColor: colors.esFill,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0,
      fill: true,
    },
  ];

  if (euOn && payload.eu) {
    datasets.push({
      label: 'Unión Europea (media de los 27)',
      // NaN deja un hueco en la línea en lugar de un cero engañoso.
      data: payload.es.map((point) => eu.get(point.period) ?? Number.NaN),
      borderColor: colors.eu,
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0,
      fill: false,
      spanGaps: false,
    });
  }

  return {
    geoOn: euOn,
    data: {
      labels: payload.es.map((point) => shortPeriod(point.period)),
      datasets,
    },
  };
}

/** Resumen textual que acompaña a la gráfica y alimenta `aria-describedby`. */
export function describeChart(payload: SeriesPayload, state: ChartState): string {
  const { geoOn } = buildChartData(payload, state);
  const first = payload.es[0];
  const last = payload.es[payload.es.length - 1];
  const parts = [
    `${payload.title}, en ${payload.unit}. Serie de ${shortPeriod(first?.period ?? '')} a ${shortPeriod(
      last?.period ?? '',
    )}: de ${formatValue(first?.value ?? 0, payload.decimals)} a ${formatValue(
      last?.value ?? 0,
      payload.decimals,
    )}.`,
  ];

  if (geoOn && payload.eu) {
    const euLast = payload.eu[payload.eu.length - 1];
    if (euLast && last) {
      parts.push(
        `En la misma fecha, la media de la Unión Europea es de ${formatValue(
          euLast.value,
          payload.decimals,
        )}.`,
      );
    }
  }

  if (state.view === 'bar') {
    const before = at(payload.es, payload.baselinePeriod);
    const after = at(payload.es, payload.currentPeriod);
    parts.push(
      `Comparación entre ${longPeriod(before?.period ?? '')} y ${longPeriod(after?.period ?? '')}.`,
    );
  }

  return parts.join(' ');
}

export interface SeriesChartHandle {
  /** Redibuja con un nuevo estado. Reutiliza la instancia si la vista no cambia. */
  render(state: ChartState): Promise<void>;
  destroy(): void;
  readonly chart: import('chart.js').Chart | null;
}

/**
 * Monta la gráfica sobre un canvas. Chart.js se importa de forma diferida: el
 * resto de la página no paga el coste de la librería.
 */
export async function mountSeriesChart(
  canvas: HTMLCanvasElement,
  payload: SeriesPayload,
  initialState: ChartState,
  options: { reducedMotion: boolean },
): Promise<SeriesChartHandle> {
  const module = await import('chart.js/auto');
  const Chart = (module.default ?? module) as unknown as typeof import('chart.js').Chart;

  let chart: import('chart.js').Chart | null = null;
  let state = initialState;

  const build = (): ReturnType<typeof buildChartData> => buildChartData(payload, state);
  const colors = readPalette();

  const render = async (next: ChartState): Promise<void> => {
    // Cambiar entre línea y barra exige recrear el tipo de.dataset.
    const typeChanged = chart && next.view !== state.view;
    state = next;
    const { data } = build();

    if (chart && typeChanged) {
      chart.destroy();
      chart = null;
    }

    if (chart) {
      chart.data.labels = data.labels;
      chart.data.datasets = data.datasets as never;
      chart.update();
      return;
    }

    chart = new Chart(canvas, {
      type: state.view === 'bar' ? 'bar' : 'line',
      data: { labels: data.labels, datasets: data.datasets as never },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: options.reducedMotion ? false : { duration: 220 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: data.datasets.length > 1,
            labels: {
              boxWidth: 14,
              color: colors.heading,
              font: { family: colors.font },
            },
          },
          tooltip: {
            displayColors: true,
            callbacks: {
              title: (items: { label?: string | string[] }[]) =>
                longPeriod(String(items[0]?.label ?? '')),
              label: (context: unknown) => {
                const ctx = context as {
                  dataset: { label?: string };
                  parsed: { y?: number };
                };
                if (!Number.isFinite(ctx.parsed.y)) return `${ctx.dataset.label}: sin dato`;
                return `${ctx.dataset.label}: ${formatValue(
                  Number(ctx.parsed.y),
                  payload.decimals,
                )} ${payload.unit}`;
              },
            },
          },
        },
        scales: {
          y: {
            // Escala honesta: sin beginAtZero forzado y sin recortar el eje.
            beginAtZero: false,
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              font: { family: colors.font },
              callback: (value: string | number) =>
                formatValue(Number(value), Math.min(payload.decimals, 2)),
            },
          },
          x: {
            grid: { display: false },
            ticks: {
              color: colors.text,
              font: { family: colors.font },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
        },
      },
    });
  };

  await render(state);

  return {
    render,
    destroy: () => chart?.destroy(),
    get chart() {
      return chart;
    },
  };
}

/**
 * Carga la gráfica solo cuando entra en pantalla. Devuelve un botón de
 * arranque manual para los casos sin IntersectionObserver.
 */
export function onFirstVisible(
  canvas: HTMLCanvasElement,
  start: () => void,
  rootMargin = '200px',
): void {
  if (!('IntersectionObserver' in window)) {
    start();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          start();
          return;
        }
      }
    },
    { rootMargin },
  );
  observer.observe(canvas);
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
