// -----------------------------------------------------------------------------
// The pure functions, on the real answers of Irish Rail: XML reading, the
// departures of a station (terminating trains dropped), the filters and the
// station search.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decode, parseRecords } from '../src/irishrail.js';
import { aged, applyFilters, delayOf, findStations, fold, parseDepartures } from '../src/trains.js';
import { FIXTURE_TIME, fixtureText, recordedBoard } from './helpers/world.js';

const stations = () =>
  parseRecords(fixtureText('stations.xml'), 'objStation').map((record) => ({
    code: record.StationCode,
    name: record.StationDesc,
    alias: record.StationAlias,
    id: Number(record.StationId),
  }));

test('the XML records are read, trimmed, with entities decoded and empty elements', () => {
  const [first] = recordedBoard('PERSE');
  assert.equal(first.Traincode, 'E908');
  assert.equal(first.Stationfullname, 'Dublin Pearse');
  const [belfast] = parseRecords(fixtureText('stations.xml'), 'objStation');
  assert.equal(belfast.StationAlias, '');
  assert.equal(decode('Rock &amp; Roll &#233; &#x41;'), 'Rock & Roll é A');
  assert.deepEqual(parseRecords(fixtureText('empty.xml'), 'objStationData'), []);
  assert.equal(stations().length, 171);
});

test('the departures of Dublin Pearse: the terminating trains are not departures', () => {
  const records = recordedBoard('PERSE');
  assert.equal(records.length, 34);
  const departures = parseDepartures(records, FIXTURE_TIME);
  // P605, P654 and P607 end at Pearse.
  assert.equal(departures.length, 31);
  assert.ok(!departures.some((departure) => ['P605', 'P654', 'P607'].includes(departure.code)));
  const [next, following] = departures;
  assert.deepEqual(
    [next.code, next.type, next.destination, next.minutes, next.late, next.time, next.scheduled],
    ['D404', 'train', 'Hazelhatch', 3, 6, '08:40', '08:34'],
  );
  assert.deepEqual(
    [following.code, following.type, following.destination],
    ['E210', 'dart', 'Bray'],
  );
  assert.equal(following.late, -2);
  assert.equal(delayOf(following), 0, 'an early train is on time');
  assert.equal(next.expected, FIXTURE_TIME + 3 * 60000);
  // A train starting here has no arrival time: its departure is used.
  const starting = departures.find((departure) => departure.code === 'D908');
  assert.equal(starting.time, '09:10');
  assert.equal(starting.running, false);
});

test('Dublin Heuston: only the trains starting there leave', () => {
  const departures = parseDepartures(recordedBoard('HSTON'), FIXTURE_TIME);
  assert.deepEqual(
    departures.map((departure) => `${departure.time} ${departure.destination}`),
    ['09:00 Cork', '09:20 Portlaoise', '09:25 Galway', '09:50 Newbridge', '10:00 Cork'],
  );
});

test('the type and direction filters', () => {
  const departures = parseDepartures(recordedBoard('PERSE'), FIXTURE_TIME);
  const dartNorth = applyFilters(departures, { type: 'dart', direction: 'northbound' });
  assert.ok(dartNorth.length > 0);
  assert.ok(dartNorth.every((d) => d.type === 'dart' && d.direction === 'Northbound'));
  const howth = applyFilters(departures, { type: '', direction: 'HOWTH' });
  assert.ok(howth.length > 0 && howth.every((d) => d.destination === 'Howth'));
  const trains = applyFilters(departures, { type: 'train', direction: '' });
  assert.ok(trains.every((d) => d.type === 'train'));
  assert.equal(applyFilters(departures, {}).length, departures.length);
  assert.deepEqual(applyFilters(departures, { direction: 'Sligo' }), []);
});

test('the countdowns age between two reads, the trains gone are dropped', () => {
  const departures = parseDepartures(recordedBoard('PERSE'), FIXTURE_TIME);
  const later = aged(departures, FIXTURE_TIME + 5 * 60000);
  assert.equal(later[0].code, 'E210');
  assert.equal(later[0].minutes, 0);
  assert.ok(!later.some((departure) => departure.code === 'D404'), 'left 2 minutes ago');
});

test('the station search: code, name, alias, part of a name, homonyms', () => {
  const list = stations();
  assert.deepEqual(
    findStations(list, 'perse').map((s) => s.code),
    ['PERSE'],
  );
  assert.deepEqual(
    findStations(list, 'Pearse').map((s) => s.code),
    ['PERSE'],
    'by its alias',
  );
  assert.deepEqual(
    findStations(list, 'dublin pearse').map((s) => s.code),
    ['PERSE'],
  );
  assert.equal(findStations(list, 'Adamstown').length, 3, 'three codes, one name');
  assert.ok(findStations(list, 'dublin').length >= 4);
  assert.deepEqual(findStations(list, 'Atlantis'), []);
  assert.deepEqual(findStations(list, '  '), []);
  assert.equal(fold('Dún Laoghaire (Mallin)'), 'dun laoghaire mallin');
});
