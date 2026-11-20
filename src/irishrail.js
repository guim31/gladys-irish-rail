// -----------------------------------------------------------------------------
// The Irish Rail realtime API (http://api.irishrail.ie/realtime/), public, free
// and without key, read over HTTPS: the list of the stations and the trains due
// at one station in the next 90 minutes. It answers XML: a list of flat
// records, read here without a dependency.
// -----------------------------------------------------------------------------

export const API_URL = 'https://api.irishrail.ie/realtime/realtime.asmx';
const HOST = 'api.irishrail.ie';
const TIMEOUT_MS = 20000;
// The window of the station board, in minutes: the most the API documents.
export const BOARD_MINUTES = 90;
// Station codes: four or five letters or digits ("PERSE", "BRAY", "M3WAY").
export const STATION_CODE = /^[A-Z0-9]{3,6}$/;

export class IrishRailError extends Error {}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** "Dun Laoghaire &amp; Co" → "Dun Laoghaire & Co". */
export function decode(text) {
  return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name] ?? whole;
  });
}

/**
 * The records of an answer: every `<tag>` element as an object of its child
 * elements, texts trimmed ("E908 " → "E908"), empty elements as "".
 * @param {string} xml
 * @param {string} tag "objStation", "objStationData"
 * @returns {Record<string, string>[]}
 */
export function parseRecords(xml, tag) {
  const records = [];
  const element = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
  for (const [, body] of String(xml ?? '').matchAll(element)) {
    const record = {};
    for (const [, name, text] of body.matchAll(/<(\w+)>([^<]*)<\/\1>/g)) {
      record[name] = decode(text).trim();
    }
    for (const [, name] of body.matchAll(/<(\w+)\s*\/>/g)) {
      record[name] ??= '';
    }
    records.push(record);
  }
  return records;
}

export class IrishRail {
  /** @param {{ fetch?: typeof fetch }} [options] */
  constructor({ fetch: fetchImpl = globalThis.fetch } = {}) {
    this.fetch = fetchImpl;
  }

  async get(method, params = {}) {
    const url = new URL(`${API_URL}/${method}`);
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value);
    }
    let response;
    try {
      response = await this.fetch(url.toString(), {
        headers: { Accept: 'text/xml' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new IrishRailError(
        `${HOST}: ${err.name === 'TimeoutError' ? 'timeout' : 'unreachable'}`,
      );
    }
    if (!response.ok) {
      throw new IrishRailError(`${HOST}: HTTP ${response.status}`);
    }
    const text = await response.text().catch(() => '');
    // An answer that is not the expected XML list (a maintenance page): an
    // error, never an empty board.
    if (!/<ArrayOfObj/.test(text)) {
      throw new IrishRailError(`${HOST}: unexpected answer`);
    }
    return text;
  }

  /** Every station: [{ code, name, alias, id }]. */
  async stations() {
    const xml = await this.get('getAllStationsXML');
    return parseRecords(xml, 'objStation')
      .map((record) => ({
        code: String(record.StationCode ?? '').toUpperCase(),
        name: record.StationDesc ?? '',
        alias: record.StationAlias ?? '',
        id: Number(record.StationId) || 0,
      }))
      .filter((station) => STATION_CODE.test(station.code) && station.name);
  }

  /**
   * The raw records of the trains due at a station in the next 90 minutes.
   * An unknown code and a station without train both answer an empty list.
   */
  async board(code) {
    if (!STATION_CODE.test(code)) {
      return [];
    }
    const xml = await this.get('getStationDataByCodeXML_WithNumMins', {
      StationCode: code,
      NumMins: String(BOARD_MINUTES),
    });
    return parseRecords(xml, 'objStationData');
  }
}
