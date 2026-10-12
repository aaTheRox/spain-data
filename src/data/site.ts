/** Configuración editorial del sitio. Única fuente para metadatos y pie de página. */

export const SITE = {
  name: 'España, en datos',
  shortName: 'España, en datos',
  tagline: 'Indicadores oficiales de España desde 2018, con la fuente de cada cifra a un clic.',
  description:
    'Comparación documentada de indicadores oficiales de España desde el 1 de junio de 2018: empleo, precios, vivienda, energía y finanzas públicas. Cada cifra enlaza a su serie de origen.',
  locale: 'es_ES',
  lang: 'es',
  /** Dominio de producción. Debe coincidir con `site` en astro.config.mjs. */
  url: 'https://indicadores-espana.example.org',
  maintainer: 'Proyecto ciudadano de datos abiertos',
  contactEmail: 'contacto@aranmedia.com',
} as const;

export interface PendingTopic {
  topic: string;
  reason: string;
}

/**
 * Temas de interés que NO se publican por falta de una serie oficial
 * homogénea y comparable entre 2017-2018 y el último dato disponible.
 * Se listan para dejar constancia del criterio de exclusión.
 */
export const PENDING: PendingTopic[] = [
  {
    topic: 'Pensiones',
    reason:
      'Requiere unir series de la Seguridad Social con el índice de precios. Buena parte de las subidas se decidió antes de 2018, así que no se puede atribuir al periodo analizado.',
  },
  {
    topic: 'Listas de espera sanitarias',
    reason:
      'Las publicaciones del Ministerio de Sanidad usan cortes y metodologías distintas entre 2018 y la actualidad. No hay serie trimestral nacional continua.',
  },
  {
    topic: 'Abandono educativo temprano',
    reason:
      'La serie disponible mide la participación de la población joven en educación o formación. No equivale al abandono temprano según la definición europea.',
  },
  {
    topic: 'Infraestructuras y transporte',
    reason:
      'Los indicadores se publican por proyecto y por administración. No hay serie nacional anual homogénea que permita comparar.',
  },
  {
    topic: 'Afiliación a la Seguridad Social y paro registrado',
    reason:
      'Son series mensuales relevantes. Su comparación con la Encuesta de Población Activa exige explicar el cambio metodológico de 2025. Queda pendiente de verificación.',
  },
];