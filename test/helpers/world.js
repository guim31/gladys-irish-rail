// -----------------------------------------------------------------------------
// A complete test world: the SDK's fake Gladys, a fake `fetch` answering like
// the Irish Rail realtime API from the real answers of test/fixtures/irish-rail
// (captured on Friday 2026-11-20 at 08:37 in Dublin, the morning rush: Dublin
// Pearse with DART and commuter trains both ways, Dublin Heuston where every
// train starts or ends, Bray; `empty.xml` is the answer of a station without
// train, at night, and of an unknown code), a manual clock, a temporary /data,
// and the integration wired on top through registerHandlers. Nothing touches
// the network.
// -----------------------------------------------------------------------------

import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { registerHandlers } from '../../src/app.js';
import { parseRecords } from '../../src/irishrail.js';
import { Store } from '../../src/store.js';

process.env.LOG_LEVEL ??= 'silent';
process.env.TZ = 'Europe/Dublin';

const fixturePath = (name) => new URL(`../fixtures/irish-rail/${name}`, import.meta.url);
export const fixtureText = (name) => readFileSync(fixturePath(name), 'utf8');

// 2026-11-20 08:37:39 in Dublin (UTC in winter): the Querytime of the boards.
export const FIXTURE_TIME = Date.parse('2026-11-20T08:37:39Z');

/** The records of a recorded board (a copy the test may change). */
export const recordedBoard = (code) =>
  existsSync(fixturePath(`${code}.xml`))
    ? parseRecords(fixtureText(`${code}.xml`), 'objStationData')
    : [];

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Records back to the XML the API sends. */
export function boardXml(records) {
  const header =
    '<?xml version="1.0" encoding="utf-8"?>\n<ArrayOfObjStationData xmlns="http://api.irishrail.ie/realtime/">';
  if (records.length === 0) {
    return '<?xml version="1.0" encoding="utf-8"?>\n<ArrayOfObjStationData xmlns="http://api.irishrail.ie/realtime/" />';
  }
  const body = records
    .map(
      (record) =>
        `  <objStationData>\n${Object.entries(record)
          .map(([name, value]) => `    <${name}>${escape(value)}</${name}>`)
          .join('\n')}\n  </objStationData>`,
    )
    .join('\n');
  return `${header}\n${body}\n</ArrayOfObjStationData>`;
}

/**
 * A fake `fetch` answering like Irish Rail. `boards` holds the records each
 * station answers (change them to stage a delay); `fail` makes every request
 * fail with an Error or an HTTP status. Every call is recorded in `calls`.
 */
export function createFetch() {
  const boards = {};
  for (const code of ['PERSE', 'HSTON', 'BRAY']) {
    boards[code] = recordedBoard(code);
  }
  const network = { boards, calls: [], fail: null };
  const xml = (text) =>
    new Response(text, { status: 200, headers: { 'content-type': 'text/xml; charset=utf-8' } });
  network.fetch = async (url) => {
    network.calls.push({ url });
    if (network.fail instanceof Error) {
      throw network.fail;
    }
    if (typeof network.fail === 'number') {
      return new Response('<html>error</html>', { status: network.fail });
    }
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/getAllStationsXML')) {
      return xml(fixtureText('stations.xml'));
    }
    if (parsed.pathname.endsWith('/getStationDataByCodeXML_WithNumMins')) {
      const code = parsed.searchParams.get('StationCode');
      return xml(boardXml(network.boards[code] ?? []));
    }
    return new Response('not found', { status: 404 });
  };
  network.boardRequests = () => network.calls.filter((call) => /StationData/.test(call.url));
  return network;
}

/** Every train of a board a minute later: Duein one less, the ones due gone. */
export function tick(records) {
  return records
    .map((record) => ({ ...record, Duein: String(Number(record.Duein) - 1) }))
    .filter((record) => Number(record.Duein) >= 0);
}

/** A manual clock. */
export function createClock(start = FIXTURE_TIME) {
  const clock = {
    time: start,
    now: () => clock.time,
    advance(ms) {
      clock.time += ms;
    },
  };
  return clock;
}

/**
 * @param {object} [options]
 * @param {object} [options.config] raw integration config
 * @param {object} [options.network] from createFetch
 * @param {Array} [options.devices] devices already created in Gladys
 * @param {object} [options.saved] content of /data/watch.json before the start
 * @param {boolean} [options.connect]
 * @param {boolean} [options.timers]
 */
export async function createWorld({
  config = {},
  network = createFetch(),
  devices = [],
  saved,
  connect = true,
  timers = false,
  clock = createClock(),
  dataDir = mkdtempSync(join(tmpdir(), 'gladys-irish-rail-')),
} = {}) {
  const gladys = createFakeGladys({ config, devices });
  const store = new Store(dataDir);
  if (saved) {
    await store.save(saved);
    await store.flush();
  }
  const app = registerHandlers(gladys, {
    store,
    fetch: network.fetch,
    timers,
    now: clock.now,
    dataDir,
  });
  const world = { gladys, fake: gladys.fake, app, service: app.service, network, clock, store };
  if (connect) {
    await gladys.connect();
    await app.ready;
  }
  return world;
}

/** Run a configuration action; resolves with its message (multi-language). */
export async function action(world, key, fields = {}) {
  const ack = await world.fake.action(key, fields);
  if (!ack.success) {
    throw new Error(`action ${key} failed: ${JSON.stringify(ack.error)}`);
  }
  return ack.data.message;
}

/** The discovered device whose name contains `name`. */
export function discovered(world, name) {
  const device = world.fake.discoveredDevices.find((d) => d.name.includes(name));
  if (!device) {
    throw new Error(`no discovered device named ${name}`);
  }
  return device;
}

/** "Add to Gladys" on the discovered device named `name`; resolves with it. */
export async function create(world, name) {
  const device = discovered(world, name);
  await world.fake.deviceCreated(device);
  return device;
}

/** The last state published on a feature of a device. */
export const lastState = (world, device, key) =>
  world.fake.lastState(`${device.external_id}:${key}`);

/** Captures the log lines of the integration at `level` and above. */
export function captureLogs(t, level = 'info') {
  const previous = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = level;
  const lines = [];
  const record = (...args) => {
    const text = args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' ');
    const match = /^\[[^\]]+\] \[(\w+)\]/.exec(text);
    lines.push({ level: match ? match[1].toLowerCase() : 'raw', text });
  };
  t.mock.method(console, 'log', record);
  t.mock.method(console, 'error', record);
  t.after(() => {
    process.env.LOG_LEVEL = previous;
  });
  return lines;
}
