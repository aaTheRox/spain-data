import { INDICATORS } from '../data/indicators';
import type { Indicator, IndicatorSeed, Reading, Trend } from '../types';

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

const ORDINALS = ['primer', 'segundo', 'tercer', 'cuarto'];

/**
 * Etiqueta legible y exacta de un periodo. Nunca devuelve «antes» ni «ahora».
 */
export function periodLabel(period: string): string {
  const quarter = /^(\d{4})-Q([1-4])$/.exec(period);
  if (quarter?.[1] && quarter[2]) {
    const ordinal = ORDINALS[Number(quarter[2]) - 1] ?? `${quarter[2]}.º`;
    return `${ordinal} trimestre de ${quarter[1]}`;
  }
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month?.[1] && month[2]) {
    return `${MONTHS[Number(month[2]) - 1]} de ${month[1]}`;
  }
  return period;
}

/** Etiqueta corta para ejes de gráficas. */
export function shortPeriod(period: string): string {
  const quarter = /^(\d{4})-Q([1-4])$/.exec(period);
  if (quarter?.[1] && quarter[2]) return `${quarter[1]} T${quarter[2]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(period);
  if (month?.[1] && month[2]) return `${MONTHS[Number(month[2]) - 1]?.slice(0, 3)} ${month[1]}`;
  return period;
}

export function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatSigned(value: number, decimals: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${formatNumber(Math.abs(value), decimals)}`;
}

function relativeChange(baseline: number, current: number): number | undefined {
  if (baseline === 0) return undefined;
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

const VERDICTS: Record<Trend, (down: boolean) => string> = {
  down: () => 'disminuye',
  up: () => 'aumenta',
  mixed: () => 'recorrido no uniforme: primero sube y después baja',
  neutral: () => 'se mantiene estable',
} satisfies Record<Trend, (down: boolean) => string>;

/** Lectura editorial del movimiento, nunca inferida solo del signo numérico. */
function verdictFor(reading: Reading, change: number, trend: Trend): string {
  if (trend === 'mixed') return VERDICTS.mixed(false);
  if (trend === 'neutral' || change === 0) return VERDICTS.neutral(false);
  const goesDown = change < 0;
  if (reading === 'context') return goesDown ? 'disminuye' : 'aumenta';
  const isImprovement = reading === 'lower-is-better' ? goesDown : !goesDown;
  return isImprovement ? 'mejora' : 'empeora';
}

function valueAt(series: IndicatorSeed['series']['es'], period: string): number {
  const found = series.find((point) => point.period === period);
  if (!found) {
    throw new Error(
      `El periodo «${period}» no existe en la serie. No se publica una comparación sin valores comparables.`,
    );
  }
  return found.value;
}

function buildChange(seed: IndicatorSeed, baseline: number, current: number) {
  const difference = current - baseline;

  if (seed.changeKind === 'percentage-point') {
    return {
      kind: seed.changeKind,
      absolute: difference,
      absoluteLabel: `${formatSigned(difference, seed.decimals)} pp`,
      verdict: verdictFor(seed.reading, difference, seed.trend),
    } satisfies Indicator['change'];
  }

  const relative = relativeChange(baseline, current);
  const relativeLabel =
    relative === undefined ? undefined : `${formatSigned(relative, 1)} %`;

  if (seed.changeKind === 'absolute') {
    return {
      kind: seed.changeKind,
      absolute: difference,
      absoluteLabel: `${formatSigned(difference, seed.decimals)} ${seed.unit}`,
      relative,
      relativeLabel,
      verdict: verdictFor(seed.reading, difference, seed.trend),
    } satisfies Indicator['change'];
  }

  return {
    kind: seed.changeKind,
    absolute: difference,
    absoluteLabel: relativeLabel ?? `${formatSigned(difference, seed.decimals)}`,
    relative,
    relativeLabel,
    verdict: verdictFor(seed.reading, difference, seed.trend),
  } satisfies Indicator['change'];
}

/**
 * Valida y completa un indicador. Falla en compilación si falta cualquier campo
 * obligatorio o si la comparación no es posible, en lugar de publicar un hueco.
 */
function buildIndicator(seed: IndicatorSeed): Indicator {
  const baselineValue = valueAt(seed.series.es, seed.baselinePeriod);
  const currentValue = valueAt(seed.series.es, seed.currentPeriod);

  if (seed.series.eu) {
    valueAt(seed.series.eu, seed.baselinePeriod);
    valueAt(seed.series.eu, seed.currentPeriod);
  }

  return {
    ...seed,
    baselineValue,
    currentValue,
    baselineLabel: periodLabel(seed.baselinePeriod),
    currentLabel: periodLabel(seed.currentPeriod),
    change: buildChange(seed, baselineValue, currentValue),
  };
}

let cache: Indicator[] | undefined;

/** Indicadores validados. Solo se calculan una vez por compilación. */
export function getIndicators(): Indicator[] {
  if (!cache) cache = INDICATORS.map(buildIndicator);
  return cache;
}

/** Indicadores publicables: excluye los que no están verificados. */
export function getPublishedIndicators(): Indicator[] {
  return getIndicators().filter((indicator) => indicator.status === 'verified');
}

export function getIndicatorById(id: string): Indicator | undefined {
  return getIndicators().find((indicator) => indicator.id === id);
}