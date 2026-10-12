/**
 * Tipos del modelo de indicadores.
 *
 * Reglas de diseño (ver AGENT.md):
 * - Los datos viven una sola vez en `src/data/indicators.ts`.
 * - `baselineValue` / `currentValue` NO se escriben a mano: se derivan de la
 *   serie y de los periodos declarados, de modo que nunca pueden divergir del
 *   gráfico o de la tabla.
 * - Un indicador sin valores comparables no se publica como cifra.
 */

export type CategoryId =
  | 'economia'
  | 'empleo'
  | 'vivienda'
  | 'servicios'
  | 'energia'
  | 'finanzas';

/** Sentido del indicador. Nunca se infiere solo del signo numérico. */
export type Reading = 'higher-is-better' | 'lower-is-better' | 'context';

/** Cómo se expresa la variación entre los dos periodos comparados. */
export type ChangeKind =
  | 'percentage-point' // tasas: la variación se mide en puntos porcentuales
  | 'relative' // índices y magnitudes: variación relativa en %
  | 'absolute'; // unidades físicas: diferencia absoluta

export type Trend = 'up' | 'down' | 'mixed' | 'neutral';

export type Status = 'verified' | 'needs-review' | 'placeholder';

export interface DataPoint {
  /** Periodo tal y como lo etiqueta la fuente: `2018-05`, `2026-Q2`, `2017`. */
  period: string;
  value: number;
}

export interface Source {
  /** Nombre legible de la fuente primaria. */
  name: string;
  /** Enlace directo a la tabla o serie, no a una página genérica. */
  url: string;
  /** Código de la serie en el Statistical Data Warehouse de Eurostat. */
  dataset: string;
  /** Descripción de los filtros aplicados a la serie. */
  selection: string;
  /** Fecha de actualización de la serie en el portal de la fuente. */
  datasetUpdatedAt: string;
}

export interface IndicatorSeed {
  id: string;
  title: string;
  category: CategoryId;
  /** Frase corta y verificable que resume el dato, sin interpretación política. */
  summary: string;
  reading: Reading;
  /** Periodo de referencia inicial: último dato oficial anterior al 1 de junio de 2018. */
  baselinePeriod: string;
  /** Último periodo oficial disponible en la fecha de revisión. */
  currentPeriod: string;
  unit: string;
  decimals: number;
  changeKind: ChangeKind;
  source: Source;
  methodology: string;
  context: string;
  trend: Trend;
  status: Status;
  series: {
    es: DataPoint[];
    eu?: DataPoint[];
  };
  /** Etiqueta de la serie de comparación, si la hay. */
  euLabel?: string;
}

/** Indicador ya validado: incluye los valores derivados de la serie. */
export interface Indicator extends IndicatorSeed {
  baselineValue: number;
  baselineLabel: string;
  currentValue: number;
  currentLabel: string;
  change: {
    kind: ChangeKind;
    /** Diferencia absoluta en la unidad del indicador. */
    absolute: number;
    /** Texto ya formateado, listo para publicar. */
    absoluteLabel: string;
    /** Variación relativa en %, solo para magnitudes, no para tasas. */
    relative?: number;
    relativeLabel?: string;
    /** Lectura editorial de la variación, en texto. */
    verdict: string;
  };
}

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}