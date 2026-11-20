// -----------------------------------------------------------------------------
// The integration end to end, against the SDK's fake Gladys and a fake Irish
// Rail answering the real recorded boards: the actions (green on success, red
// on failure), the devices and their states, the night without train, Irish
// Rail down, the triggers, the scene action, the widget, the restoration
// after /data is lost, the container's own timer and the quiet logs.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { NO_DEPARTURE_MINUTES } from '../src/devices.js';
import { TRIGGERS } from '../src/service.js';
import { stageEverything } from './helpers/scenario.js';
import {
  action,
  captureLogs,
  create,
  createFetch,
  createWorld,
  lastState,
  tick,
} from './helpers/world.js';

async function pearse(t, options = {}) {
  const world = await createWorld(options);
  t.after(() => world.app.stop());
  await action(world, 'add_station', { station: 'Dublin Pearse' });
  const device = await create(world, 'Dublin Pearse');
  return { world, device };
}

test('search: the stations matching a name, with their code', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const message = await action(world, 'search_stations', { query: 'Pearse' });
  assert.match(message.en, /1 station\(s\) found/);
  assert.match(message.fr, /• Dublin Pearse \(Pearse\) \[PERSE\]/);
  const failed = await world.fake.action('search_stations', { query: 'Atlantis' });
  assert.equal(failed.success, false);
  assert.match(failed.error.fr, /Aucune gare ne correspond à « Atlantis »/);
  // The station list is read once, then kept.
  await action(world, 'search_stations', { query: 'Bray' });
  assert.equal(world.network.calls.filter((call) => /AllStations/.test(call.url)).length, 1);
});

test('add: by name, by code; homonyms, unknown names and duplicates are refused in red', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const added = await action(world, 'add_station', { station: 'Dublin Pearse' });
  assert.match(added.fr, /Dublin Pearse ajoutée/);
  const filtered = await action(world, 'add_station', {
    station: 'perse',
    train_type: 'dart',
    direction: 'Northbound',
  });
  assert.match(filtered.en, /Dublin Pearse \(DART · → Northbound\) added/);
  assert.equal(world.fake.discoveredDevices.length, 2);

  const twice = await world.fake.action('add_station', { station: 'PERSE' });
  assert.equal(twice.success, true);
  assert.match(twice.data.message.en, /already watched/);

  const homonyms = await world.fake.action('add_station', { station: 'Adamstown' });
  assert.equal(homonyms.success, false);
  assert.match(homonyms.error.fr, /Plusieurs gares correspondent/);
  assert.match(homonyms.error.fr, /\[ADMTN\]/);

  const unknown = await world.fake.action('add_station', { station: 'Atlantis' });
  assert.equal(unknown.success, false);
  assert.match(unknown.error.de, /Kein Irish-Rail-Bahnhof passt zu „Atlantis“/);

  world.network.fail = new Error('ECONNREFUSED');
  world.service.stationList = null;
  const down = await world.fake.action('add_station', { station: 'Bray' });
  assert.equal(down.success, false);
  assert.match(down.error.fr, /Irish Rail est illisible \(api\.irishrail\.ie: unreachable\)/);
});

test('a created station publishes its next trains, delay and destination', async (t) => {
  const { world, device } = await pearse(t);
  assert.equal(device.should_poll, false);
  assert.equal(device.poll_frequency, undefined);
  assert.equal(lastState(world, device, 'next'), 3);
  assert.equal(lastState(world, device, 'following'), 4);
  assert.equal(lastState(world, device, 'delay'), 6);
  assert.equal(lastState(world, device, 'destination'), '08:40 Train → Hazelhatch');
  assert.deepEqual(world.fake.widgetRefreshes, ['departures']);
  // Two minutes later without a new read: the countdowns go on.
  world.network.fail = 503;
  world.clock.advance(120000);
  await world.service.refresh();
  assert.equal(lastState(world, device, 'next'), 1);
  assert.equal(lastState(world, device, 'destination'), '08:40 Train → Hazelhatch');
});

test('the filters of a watch: DART northbound, a terminus to Cork', async (t) => {
  const world = await createWorld({ config: { language: 'en' } });
  t.after(() => world.app.stop());
  await action(world, 'add_station', { station: 'PERSE', train_type: 'dart', direction: 'north' });
  await action(world, 'add_station', { station: 'Heuston', direction: 'Cork' });
  const dart = await create(world, 'Dublin Pearse');
  const heuston = await create(world, 'Heuston');
  assert.equal(lastState(world, dart, 'destination'), '08:43 DART → Howth');
  assert.equal(lastState(world, dart, 'next'), 6);
  assert.equal(lastState(world, heuston, 'next'), 23);
  assert.equal(lastState(world, heuston, 'following'), 83);
  // Two watches, two stations: one request each per refresh.
  const before = world.network.boardRequests().length;
  await world.service.refresh();
  assert.equal(world.network.boardRequests().length - before, 2);
});

test('the night: no train in the next 90 minutes', async (t) => {
  const network = createFetch();
  network.boards.PERSE = [];
  const { world, device } = await pearse(t, { network });
  assert.equal(lastState(world, device, 'next'), NO_DEPARTURE_MINUTES);
  assert.equal(lastState(world, device, 'following'), NO_DEPARTURE_MINUTES);
  assert.equal(lastState(world, device, 'delay'), 0);
  assert.equal(lastState(world, device, 'destination'), 'Aucun train dans les 90 minutes');
  const result = await world.fake.sceneAction('get_next_departures', {
    station: device.external_id,
  });
  assert.equal(result.success, true);
  assert.match(result.data.outputs.sentence, /Aucun train au départ de Dublin Pearse/);
  const widget = await world.fake.widgetGet('departures', {
    settings: { station: device.external_id },
    language: 'fr',
  });
  assert.deepEqual(validateWidgetContent(widget.data.content), []);
  assert.equal(widget.data.content.components[1].text, 'Aucun train dans les 90 minutes');
});

test('Irish Rail down: one warning, the status says it in four languages, then it comes back', async (t) => {
  const { world } = await pearse(t);
  const logs = captureLogs(t, 'info');
  world.network.fail = new Error('ETIMEDOUT');
  for (let i = 0; i < 3; i += 1) {
    world.clock.advance(60000);
    await world.service.refresh();
  }
  const status = world.fake.connectionStatus;
  assert.equal(status.connected, false);
  assert.deepEqual(Object.keys(status.message).sort(), ['de', 'en', 'es', 'fr']);
  assert.match(status.message.en, /Irish Rail cannot be read \(api\.irishrail\.ie: unreachable\)/);
  assert.equal(logs.filter((line) => line.level === 'warn').length, 1);
  world.network.fail = null;
  world.clock.advance(60000);
  await world.service.refresh();
  assert.equal(world.fake.connectionStatus.connected, true);
  assert.equal(logs.filter((line) => /reachable again/.test(line.text)).length, 1);
  const answer = await action(world, 'status');
  assert.match(answer.fr, /Dublin Pearse \[PERSE\] — appareil créé/);
});

test('a non-XML answer (a maintenance page) is an error, not an empty board', async (t) => {
  const { world, device } = await pearse(t);
  world.network.fetch = async () => new Response('<html>maintenance</html>', { status: 200 });
  world.service.api.fetch = world.network.fetch;
  world.clock.advance(60000);
  await world.service.refresh();
  assert.equal(world.fake.connectionStatus.connected, false);
  assert.match(world.fake.connectionStatus.message.en, /unexpected answer/);
  assert.equal(lastState(world, device, 'next'), 2, 'the last board, aged');
});

test('triggers: silent at the first read, then each threshold once per train', async (t) => {
  const world = await createWorld({ config: { language: 'en' } });
  t.after(() => world.app.stop());
  const { station, events } = await stageEverything(world);
  const delayed = events.filter((event) => event.key === TRIGGERS.DELAYED);
  assert.deepEqual(
    delayed.map((event) => [event.data.train_code, event.data.threshold]),
    [
      ['E211', '5'],
      ['E211', '10'],
    ],
  );
  assert.equal(delayed[0].data.station, station.external_id);
  assert.equal(delayed[0].data.delay, 12);
  assert.equal(delayed[0].data.train_type, 'DART');
  assert.equal(delayed[0].data.destination, 'Bray');
  const soon = events.filter((event) => event.key === TRIGGERS.SOON);
  // D404 goes from 3 to 2 min, E210 from 4 to 3, E908 from 6 to 5…
  assert.deepEqual(
    soon.slice(0, 3).map((event) => [event.data.train_code, event.data.threshold]),
    [
      ['D404', '2'],
      ['E210', '3'],
      ['E908', '5'],
    ],
  );
  // The same board again: nothing new.
  const count = world.fake.sceneEvents.length;
  world.clock.advance(1000);
  await world.service.refresh();
  assert.equal(world.fake.sceneEvents.length, count);
});

test('the scene action: numbers and a sentence; a station no longer watched fails in red', async (t) => {
  const { world, device } = await pearse(t, { config: { language: 'en' } });
  const result = await world.fake.sceneAction('get_next_departures', {
    station: device.external_id,
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.data.outputs, {
    sentence:
      'Train to Hazelhatch from Dublin Pearse: in 3 min, 6 min late, then DART to Bray in 4 min.',
    station_name: 'Dublin Pearse',
    destination: 'Hazelhatch',
    train_type: 'Train',
    minutes: 3,
    following_minutes: 4,
    delay: 6,
    expected_time: '08:40',
    scheduled_time: '08:34',
  });
  await action(world, 'remove_station', { name: 'Dublin Pearse' });
  const gone = await world.fake.sceneAction('get_next_departures', {
    station: device.external_id,
  });
  assert.equal(gone.success, false);
  assert.match(gone.error.fr, /Cette gare n'est plus suivie/);
});

test('the widget: a row per departure, coloured by delay, within the core budget', async (t) => {
  const { world, device } = await pearse(t);
  const ack = await world.fake.widgetGet('departures', {
    settings: { station: device.external_id, rows: '8' },
    language: 'en',
  });
  const content = ack.data.content;
  assert.deepEqual(validateWidgetContent(content), []);
  assert.equal(content.components[0].text, device.name.slice(0, 40));
  const rows = content.components.at(-1).items;
  assert.equal(rows.length, 8);
  assert.deepEqual(rows[0], {
    label: '08:40 → Hazelhatch',
    value: '3 min · Train · +6 min',
    color: 'warning',
  });
  assert.equal(rows[1].value, '4 min · DART · on time');
  assert.equal(rows[1].color, 'success');
  const bare = await world.fake.widgetGet('departures', {
    settings: { station: device.external_id, show_legend: false },
    language: 'de',
  });
  assert.equal(bare.data.content.components.length, 2);
  assert.equal(bare.data.content.components[1].items.length, 5);
  const none = await world.fake.widgetGet('departures', { settings: {}, language: 'es' });
  assert.match(none.data.content.components[0].text, /Elija una estación/);
});

test('a lost /data: the stations are rebuilt from the Gladys devices', async (t) => {
  const first = await createWorld();
  await action(first, 'add_station', { station: 'PERSE', train_type: 'dart' });
  const device = await create(first, 'Dublin Pearse');
  await first.app.stop();
  const world = await createWorld({ devices: [device] });
  t.after(() => world.app.stop());
  assert.deepEqual(
    world.service.watches.map((watch) => [watch.code, watch.type]),
    [['PERSE', 'dart']],
  );
  assert.equal(lastState(world, device, 'next'), 4);
});

test('remove: by the name shown in the status; an unknown name fails in red', async (t) => {
  const { world } = await pearse(t);
  const failed = await world.fake.action('remove_station', { name: 'Cork' });
  assert.equal(failed.success, false);
  assert.match(failed.error.es, /Ninguna estación seguida se llama «Cork»/);
  const removed = await action(world, 'remove_station', { name: 'dublin pearse' });
  assert.match(removed.en, /no longer watched/);
  assert.equal(world.fake.discoveredDevices.length, 0);
  // Not restored from its device at the next start.
  assert.deepEqual(world.service.watches, []);
});

test('the container refreshes on its own timer, without Gladys polling', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { world } = await pearse(t, { timers: true });
  const before = world.network.boardRequests().length;
  t.mock.timers.tick(60000);
  await world.service.inflight;
  assert.equal(world.network.boardRequests().length, before + 1);
});

test('a normal cycle writes nothing at the info level', async (t) => {
  const { world } = await pearse(t);
  const logs = captureLogs(t, 'info');
  world.network.boards.PERSE = tick(world.network.boards.PERSE);
  world.clock.advance(60000);
  await world.service.refresh();
  assert.deepEqual(logs, []);
});
