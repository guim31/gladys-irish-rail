// -----------------------------------------------------------------------------
// From the raw Irish Rail records to what the integration works with: the
// departures of a station (minutes, delay, destination, DART or train), the
// filters of a watch and the station search. Pure functions: the clock is a
// parameter.
// -----------------------------------------------------------------------------

// Location types of a train at the station (`Locationtype`): O its origin,
// S a stop, D its destination, T a timing point it passes without stopping.
// Only the trains leaving the station are departures.
const DEPARTING = new Set(['O', 'S', '']);
// The types of train a watch can keep (manifest action `add_station`).
export const TRAIN_TYPES = ['dart', 'train'];

/** Lower case, without accents nor apostrophes nor brackets: "Dún Laoghaire" matches "dun laoghaire". */
export function fold(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "08:43", or "" for the "00:00" the API sends when there is no time. */
const timeOf = (text) => (/^\d{2}:\d{2}$/.test(text ?? '') && text !== '00:00' ? text : '');

/**
 * One departure per train still to leave the station, soonest first.
 * @param {Record<string, string>[]} records from IrishRail.board
 * @param {number} now ms, when the records were read
 */
export function parseDepartures(records, now) {
  const departures = new Map();
  for (const record of records ?? []) {
    const minutes = Number.parseInt(record.Duein, 10);
    const code = String(record.Traincode ?? '').trim();
    if (!code || !Number.isFinite(minutes) || !DEPARTING.has(record.Locationtype ?? '')) {
      continue;
    }
    const key = `${code}|${record.Traindate ?? ''}`;
    if (departures.has(key)) {
      continue;
    }
    const late = Number.parseInt(record.Late, 10);
    departures.set(key, {
      key,
      code,
      type: /dart/i.test(record.Traintype ?? '') ? 'dart' : 'train',
      origin: record.Origin ?? '',
      destination: record.Destination || '?',
      direction: record.Direction ?? '',
      // Expected and scheduled departure times, in Irish time as the API gives them.
      time: timeOf(record.Expdepart) || timeOf(record.Exparrival),
      scheduled: timeOf(record.Schdepart) || timeOf(record.Scharrival),
      late: Number.isFinite(late) ? late : 0,
      running: /en route/i.test(record.Status ?? ''),
      lastLocation:
        record.Lastlocation && record.Lastlocation !== 'None' ? record.Lastlocation : '',
      minutes: Math.max(0, minutes),
      expected: now + Math.max(0, minutes) * 60000,
    });
  }
  return [...departures.values()].sort(
    (a, b) => a.minutes - b.minutes || a.time.localeCompare(b.time),
  );
}

/**
 * The departures a watch keeps: its type of train and its direction, a part
 * of the destination or of the direction the API gives ("Northbound",
 * "To Cork", "Howth").
 * @param {object[]} departures from parseDepartures
 * @param {{ type?: string, direction?: string }} watch
 */
export function applyFilters(departures, watch) {
  const direction = fold(watch.direction);
  return departures.filter(
    (departure) =>
      (!watch.type || departure.type === watch.type) &&
      (!direction ||
        [departure.destination, departure.direction].some((text) =>
          fold(text).includes(direction),
        )),
  );
}

/** The departures of an earlier read, as of `now`: minutes counted again, the gone ones dropped. */
export const aged = (departures, now) =>
  departures
    .filter((departure) => departure.expected >= now - 60000)
    .map((departure) => ({
      ...departure,
      minutes: Math.max(0, Math.floor((departure.expected - now) / 60000)),
    }));

/** The delay to show: an early train is on time. */
export const delayOf = (departure) => Math.max(0, departure.late ?? 0);

/**
 * The stations matching a typed text: the exact code, else the exact name or
 * alias, else the names and aliases containing it.
 * @param {{ code: string, name: string, alias: string }[]} stations
 * @param {string} text
 */
export function findStations(stations, text) {
  const wanted = fold(text);
  if (!wanted) {
    return [];
  }
  const byCode = stations.filter((station) => station.code.toLowerCase() === wanted);
  if (byCode.length > 0) {
    return byCode;
  }
  const exact = stations.filter(
    (station) => fold(station.name) === wanted || fold(station.alias) === wanted,
  );
  if (exact.length > 0) {
    return exact;
  }
  return stations.filter(
    (station) => fold(station.name).includes(wanted) || fold(station.alias).includes(wanted),
  );
}
