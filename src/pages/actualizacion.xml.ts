import { getPublishedIndicators } from '../lib/indicators';
import { DATA_REVIEWED_AT } from '../data/indicators';
import { SITE } from '../data/site';

const indicators = getPublishedIndicators();

const escape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const entries = [
  {
    title: 'Publicación del catálogo de indicadores',
    date: DATA_REVIEWED_AT,
    description:
      'Primer conjunto de indicadores verificados: empleo, economía, vivienda, servicios públicos, energía y finanzas públicas. Cada cifra se comprobó contra su serie oficial.',
  },
  ...indicators.map((indicator) => ({
    title: `Ficha «${indicator.title}»`,
    date: DATA_REVIEWED_AT,
    description: `Periodo inicial: ${indicator.baselineLabel}. Periodo actual: ${indicator.currentLabel}. Unidad: ${indicator.unit}. Fuente: ${indicator.source.name}.`,
  })),
];

const body = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  '<channel>',
  `<title>${escape(`${SITE.name}: registro de actualización de datos`)}</title>`,
  `<link>${escape(`${SITE.url}/actualizacion.xml`)}</link>`,
  `<description>${escape(SITE.description)}</description>`,
  '<language>es</language>',
  `<lastBuildDate>${new Date(DATA_REVIEWED_AT).toUTCString()}</lastBuildDate>`,
  `<atom:link href="${escape(`${SITE.url}/actualizacion.xml`)}" rel="self" type="application/rss+xml" />`,
  ...entries.map(
    (entry) =>
      [
        '<item>',
        `<title>${escape(entry.title)}</title>`,
        `<link>${escape(`${SITE.url}/`)}</link>`,
        `<guid isPermaLink="false">${escape(`${entry.date}-${entry.title}`)}</guid>`,
        `<pubDate>${new Date(entry.date).toUTCString()}</pubDate>`,
        `<description>${escape(entry.description)}</description>`,
        '</item>',
      ].join(''),
  ),
  '</channel>',
  '</rss>',
].join('\n');

export const GET = () =>
  new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });