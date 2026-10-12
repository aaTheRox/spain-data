/**
 * Hitos del periodo. Cada entrada cita una fuente primaria concreta.
 *
 * Uso: los hitos situan en el tiempo hechos verificables. No prueban causalidad:
 * una fecha política no demuestra que un indicador se moviera por
 * esa causa. La columna `note` lo dice de forma expresa cuando corresponde.
 */

export interface Milestone {
  date: string;
  dateLabel: string;
  title: string;
  note: string;
  sourceName: string;
  sourceUrl: string;
}

export const MILESTONES: Milestone[] = [
  {
    date: '2018-06-01',
    dateLabel: '1 de junio de 2018',
    title: 'Aprobación de la moción de censura al Gobierno de Mariano Rajoy',
    note: 'Es la fecha de referencia de todo el sitio. Marca el límite entre el periodo inicial y el actual.',
    sourceName: 'Congreso de los Diputados — Diario de sesiones del Pleno',
    sourceUrl:
      'https://www.congreso.es/public_oficiales/L12/CONG/DS/PL/DSCD-12-PL-127.PDF',
  },
  {
    date: '2020-03-17',
    dateLabel: '17 de marzo de 2020',
    title: 'Real Decreto-ley 8/2020 de medidas urgentes ante el COVID-19',
    note: 'Publicada en el BOE. Marca el inicio del intervalo en el que la actividad economía cae de forma histórica.',
    sourceName: 'BOE — Real Decreto-ley 8/2020',
    sourceUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2020-3824',
  },
  {
    date: '2020-12-31',
    dateLabel: 'Año 2020',
    title: 'Caída del 11,4 % del PIB real y subida del paro al 16,5 %',
    note: 'El dato es un hecho económico del año, no un efecto atribuible a una política concreta.',
    sourceName: 'Eurostat — nama_10_gdp y une_rt_m',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/nama_10_gdp/default/table?lang=en',
  },
  {
    date: '2021-05-25',
    dateLabel: '2021',
    title: 'Puesta en marcha del mecanismo de recuperación NextGenerationEU',
    note: 'Instrumento europeo de recuperación. Es un factor de contexto común a todos los países de la UE en 2021-2026.',
    sourceName: 'Comisión Europea — NextGenerationEU',
    sourceUrl: 'https://ec.europa.eu/commission/presscorner/detail/en/ip_21_1072',
  },
  {
    date: '2022-07-31',
    dateLabel: 'Julio de 2022',
    title: 'Máximo de la inflación: 10,7 % en España y 11,5 % en la UE',
    note: 'Máximo del ciclo de precios. El nivel de precios, no la tasa, es lo que acumula el efecto sobre el poder adquisitivo.',
    sourceName: 'Eurostat — prc_hicp_manr',
    sourceUrl:
      'https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_manr/default/table?lang=en',
  },
  {
    date: '2026-07-31',
    dateLabel: 'Julio de 2026',
    title: 'Último dato de paro disponible en el momento de la revisión',
    note: 'Fecha de corte de las series mensuales de empleo. Cada indicador declara su propio periodo actual.',
    sourceName: 'Eurostat — une_rt_m',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/une_rt_m/default/table?lang=en',
  },
];