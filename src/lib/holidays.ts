// Festivos nacionales (sin los regionales) de 12 países. Funciones puras: año → lista.
// Incluye las fiestas móviles que dependen de la Pascua y las que se trasladan a lunes.

export type Holiday = { date: string; name: string };
export type Country = 'ES' | 'MX' | 'AR' | 'CO' | 'CL' | 'PE' | 'US' | 'GB' | 'FR' | 'DE' | 'IT' | 'PT';

export const COUNTRIES: Record<Country, { name: string; flag: string }> = {
  ES: { name: 'España', flag: '🇪🇸' },
  MX: { name: 'México', flag: '🇲🇽' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  CO: { name: 'Colombia', flag: '🇨🇴' },
  CL: { name: 'Chile', flag: '🇨🇱' },
  PE: { name: 'Perú', flag: '🇵🇪' },
  US: { name: 'Estados Unidos', flag: '🇺🇸' },
  GB: { name: 'Reino Unido (Inglaterra)', flag: '🇬🇧' },
  FR: { name: 'Francia', flag: '🇫🇷' },
  DE: { name: 'Alemania', flag: '🇩🇪' },
  IT: { name: 'Italia', flag: '🇮🇹' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const plus = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Domingo de Pascua (algoritmo gregoriano anónimo, «Meeus/Jones/Butcher»). */
export function easter(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), dd = ((h + l - 7 * m + 114) % 31) + 1;
  return day(y, month, dd);
}

/** n-ésimo día de la semana `wd` (0 = domingo) del mes; n = -1 → el último. */
function nth(y: number, m: number, wd: number, n: number): Date {
  if (n > 0) {
    const first = day(y, m, 1);
    return plus(first, ((wd - first.getDay() + 7) % 7) + (n - 1) * 7);
  }
  const last = day(y, m + 1, 0);
  return plus(last, -((last.getDay() - wd + 7) % 7));
}

/** Traslada al lunes siguiente si no cae en lunes (Ley Emiliani de Colombia). */
const toMonday = (d: Date) => (d.getDay() === 1 ? d : plus(d, (8 - d.getDay()) % 7));

export function holidays(country: Country, y: number): Holiday[] {
  const E = easter(y);
  const L: [Date, string][] = [];
  const add = (d: Date, name: string) => L.push([d, name]);
  const f = (m: number, d: number, name: string) => add(day(y, m, d), name);
  switch (country) {
    case 'ES':
      f(1, 1, 'Año Nuevo'); f(1, 6, 'Epifanía del Señor'); add(plus(E, -2), 'Viernes Santo'); f(5, 1, 'Fiesta del Trabajo');
      f(8, 15, 'Asunción de la Virgen'); f(10, 12, 'Fiesta Nacional de España'); f(11, 1, 'Todos los Santos');
      f(12, 6, 'Día de la Constitución'); f(12, 8, 'Inmaculada Concepción'); f(12, 25, 'Navidad');
      break;
    case 'MX':
      f(1, 1, 'Año Nuevo'); add(nth(y, 2, 1, 1), 'Día de la Constitución'); add(nth(y, 3, 1, 3), 'Natalicio de Benito Juárez');
      f(5, 1, 'Día del Trabajo'); f(9, 16, 'Día de la Independencia'); add(nth(y, 11, 1, 3), 'Día de la Revolución'); f(12, 25, 'Navidad');
      break;
    case 'AR':
      f(1, 1, 'Año Nuevo'); add(plus(E, -48), 'Carnaval'); add(plus(E, -47), 'Carnaval'); f(3, 24, 'Día de la Memoria');
      f(4, 2, 'Día del Veterano y de los Caídos en Malvinas'); add(plus(E, -2), 'Viernes Santo'); f(5, 1, 'Día del Trabajador');
      f(5, 25, 'Revolución de Mayo'); f(6, 20, 'Paso a la Inmortalidad de Manuel Belgrano'); f(7, 9, 'Día de la Independencia');
      f(12, 8, 'Inmaculada Concepción'); f(12, 25, 'Navidad');
      break;
    case 'CO':
      f(1, 1, 'Año Nuevo'); add(toMonday(day(y, 1, 6)), 'Reyes Magos'); add(toMonday(day(y, 3, 19)), 'San José');
      add(plus(E, -3), 'Jueves Santo'); add(plus(E, -2), 'Viernes Santo'); f(5, 1, 'Día del Trabajo');
      add(toMonday(plus(E, 39)), 'Ascensión del Señor'); add(toMonday(plus(E, 60)), 'Corpus Christi'); add(toMonday(plus(E, 68)), 'Sagrado Corazón');
      add(toMonday(day(y, 6, 29)), 'San Pedro y San Pablo'); f(7, 20, 'Día de la Independencia'); f(8, 7, 'Batalla de Boyacá');
      add(toMonday(day(y, 8, 15)), 'Asunción de la Virgen'); add(toMonday(day(y, 10, 12)), 'Día de la Raza'); add(toMonday(day(y, 11, 1)), 'Todos los Santos');
      add(toMonday(day(y, 11, 11)), 'Independencia de Cartagena'); f(12, 8, 'Inmaculada Concepción'); f(12, 25, 'Navidad');
      break;
    case 'CL':
      f(1, 1, 'Año Nuevo'); add(plus(E, -2), 'Viernes Santo'); add(plus(E, -1), 'Sábado Santo'); f(5, 1, 'Día del Trabajo');
      f(5, 21, 'Día de las Glorias Navales'); f(6, 29, 'San Pedro y San Pablo'); f(7, 16, 'Virgen del Carmen'); f(8, 15, 'Asunción de la Virgen');
      f(9, 18, 'Independencia Nacional'); f(9, 19, 'Día de las Glorias del Ejército'); f(10, 12, 'Encuentro de Dos Mundos');
      f(10, 31, 'Día de las Iglesias Evangélicas'); f(11, 1, 'Todos los Santos'); f(12, 8, 'Inmaculada Concepción'); f(12, 25, 'Navidad');
      break;
    case 'PE':
      f(1, 1, 'Año Nuevo'); add(plus(E, -3), 'Jueves Santo'); add(plus(E, -2), 'Viernes Santo'); f(5, 1, 'Día del Trabajo');
      f(6, 7, 'Batalla de Arica'); f(6, 29, 'San Pedro y San Pablo'); f(7, 23, 'Día de la Fuerza Aérea'); f(7, 28, 'Fiestas Patrias');
      f(7, 29, 'Fiestas Patrias'); f(8, 6, 'Batalla de Junín'); f(8, 30, 'Santa Rosa de Lima'); f(10, 8, 'Combate de Angamos');
      f(11, 1, 'Todos los Santos'); f(12, 8, 'Inmaculada Concepción'); f(12, 9, 'Batalla de Ayacucho'); f(12, 25, 'Navidad');
      break;
    case 'US':
      f(1, 1, 'Año Nuevo'); add(nth(y, 1, 1, 3), 'Día de Martin Luther King'); add(nth(y, 2, 1, 3), 'Día de los Presidentes');
      add(nth(y, 5, 1, -1), 'Día de los Caídos'); f(6, 19, 'Juneteenth'); f(7, 4, 'Día de la Independencia'); add(nth(y, 9, 1, 1), 'Día del Trabajo');
      add(nth(y, 10, 1, 2), 'Día de Colón'); f(11, 11, 'Día de los Veteranos'); add(nth(y, 11, 4, 4), 'Acción de Gracias'); f(12, 25, 'Navidad');
      break;
    case 'GB':
      f(1, 1, 'Año Nuevo'); add(plus(E, -2), 'Viernes Santo'); add(plus(E, 1), 'Lunes de Pascua'); add(nth(y, 5, 1, 1), 'Festivo de principios de mayo');
      add(nth(y, 5, 1, -1), 'Festivo de primavera'); add(nth(y, 8, 1, -1), 'Festivo de verano'); f(12, 25, 'Navidad'); f(12, 26, 'San Esteban');
      break;
    case 'FR':
      f(1, 1, 'Año Nuevo'); add(plus(E, 1), 'Lunes de Pascua'); f(5, 1, 'Fiesta del Trabajo'); f(5, 8, 'Victoria de 1945');
      add(plus(E, 39), 'Ascensión'); add(plus(E, 50), 'Lunes de Pentecostés'); f(7, 14, 'Fiesta Nacional'); f(8, 15, 'Asunción');
      f(11, 1, 'Todos los Santos'); f(11, 11, 'Armisticio de 1918'); f(12, 25, 'Navidad');
      break;
    case 'DE':
      f(1, 1, 'Año Nuevo'); add(plus(E, -2), 'Viernes Santo'); add(plus(E, 1), 'Lunes de Pascua'); f(5, 1, 'Día del Trabajo');
      add(plus(E, 39), 'Ascensión'); add(plus(E, 50), 'Lunes de Pentecostés'); f(10, 3, 'Día de la Unidad Alemana'); f(12, 25, 'Navidad'); f(12, 26, 'San Esteban');
      break;
    case 'IT':
      f(1, 1, 'Año Nuevo'); f(1, 6, 'Epifanía'); add(plus(E, 1), 'Lunes de Pascua'); f(4, 25, 'Día de la Liberación'); f(5, 1, 'Día del Trabajo');
      f(6, 2, 'Fiesta de la República'); f(8, 15, 'Ferragosto'); f(11, 1, 'Todos los Santos'); f(12, 8, 'Inmaculada Concepción'); f(12, 25, 'Navidad'); f(12, 26, 'San Esteban');
      break;
    case 'PT':
      f(1, 1, 'Año Nuevo'); add(plus(E, -2), 'Viernes Santo'); add(E, 'Pascua'); f(4, 25, 'Día de la Libertad'); f(5, 1, 'Día del Trabajador');
      add(plus(E, 60), 'Corpus Christi'); f(6, 10, 'Día de Portugal'); f(8, 15, 'Asunción'); f(10, 5, 'Implantación de la República');
      f(11, 1, 'Todos los Santos'); f(12, 1, 'Restauración de la Independencia'); f(12, 8, 'Inmaculada Concepción'); f(12, 25, 'Navidad');
      break;
  }
  return L.map(([d, name]) => ({ date: key(d), name })).sort((a, b) => a.date.localeCompare(b.date));
}

/** Festivos por fecha para un rango de años (con caché sencilla). */
const cache = new Map<string, Map<string, string>>();
export function holidayMap(country: Country, years: number[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const y of years) {
    const k = country + y;
    if (!cache.has(k)) cache.set(k, new Map(holidays(country, y).map((h) => [h.date, h.name])));
    for (const [d, n] of cache.get(k)!) out.set(d, out.has(d) ? out.get(d) + ' · ' + n : n);
  }
  return out;
}
