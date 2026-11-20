// -----------------------------------------------------------------------------
// The Gladys devices: one per watched station and set of filters (type of
// train, direction): minutes to the next departure and to the following one,
// delay of the next one, its time, type and destination.
//
// Read-only, no polling: the service refreshes everything on its own timer
// (src/service.js), Gladys never polls (`should_poll: false`). Countdowns and
// texts keep no history: a value re-read every minute whose past means nothing
// would write thousands of rows a day per station.
// -----------------------------------------------------------------------------

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} from '@gladysassistant/integration-sdk';
import { delayOf, fold } from './trains.js';
import { NAMES, TEXT, say, typeName } from './messages.js';

export const STATION_TYPE = 'station';
// Published when no departure is announced (the board covers 90 minutes).
export const NO_DEPARTURE_MINUTES = 1440;
export const MAX_TEXT_STATE = 200;
export const STATION_FEATURES = ['next', 'following', 'delay', 'destination'];

/** Shortens a text to `max` characters, with an ellipsis. */
export function clip(text, max) {
  const value = String(text ?? '');
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

const slug = (text) =>
  fold(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * The platform id of a watch: the station code, then its filters ("perse",
 * "perse-dart-to-northbound"). Two watches of the same station with other
 * filters are two devices.
 */
export function watchKey(watch) {
  return [
    String(watch.code).toLowerCase(),
    ...(watch.type ? [watch.type] : []),
    ...(watch.direction ? ['to', slug(watch.direction)] : []),
  ]
    .filter(Boolean)
    .join('-')
    .slice(0, 80);
}

/** "Dublin Pearse (DART · → Northbound)": the name of a watch. */
export function watchName(watch, language) {
  const filters = [
    ...(watch.type ? [typeName(watch.type, language)] : []),
    ...(watch.direction ? [`→ ${watch.direction}`] : []),
  ];
  return filters.length > 0 ? `${watch.name} (${filters.join(' · ')})` : watch.name;
}

const readOnly = { read_only: true, has_feedback: false, keep_history: false };

const countdown = (name, externalId) => ({
  name,
  external_id: externalId,
  category: DEVICE_FEATURE_CATEGORIES.DURATION,
  type: DEVICE_FEATURE_TYPES.DURATION.INTEGER,
  unit: DEVICE_FEATURE_UNITS.MINUTES,
  min: 0,
  max: NO_DEPARTURE_MINUTES,
  ...readOnly,
});

/**
 * The device of a watched station.
 * @param {object} gladys
 * @param {{ code: string, name: string, type: string, direction: string }} watch
 * @param {string} language
 */
export function buildStationDevice(gladys, watch, language) {
  const ids = gladys.externalIds(STATION_TYPE, watchKey(watch));
  const names = NAMES[language] ?? NAMES.en;
  return {
    name: clip(`Irish Rail · ${watchName(watch, language)}`, 80),
    external_id: ids.device,
    should_poll: false,
    // What is needed to watch the station again when /data is lost.
    params: [
      { name: 'station_code', value: watch.code },
      { name: 'station_name', value: watch.name },
      { name: 'train_type', value: watch.type ?? '' },
      { name: 'direction', value: watch.direction ?? '' },
    ],
    features: [
      countdown(names.next, ids.feature('next')),
      countdown(names.following, ids.feature('following')),
      countdown(names.delay, ids.feature('delay')),
      {
        name: names.destination,
        external_id: ids.feature('destination'),
        category: DEVICE_FEATURE_CATEGORIES.TEXT,
        type: DEVICE_FEATURE_TYPES.TEXT.TEXT,
        // NOT NULL in the core, even for a text (422 on "Add to Gladys" without).
        min: 0,
        max: 0,
        ...readOnly,
      },
    ],
  };
}

/** "08:43 DART → Howth", or "No train in the next 90 minutes". */
export function departureText(departure, language) {
  if (!departure) {
    return say(TEXT, language, 'noDeparture');
  }
  const time = departure.time ? `${departure.time} ` : '';
  return clip(
    `${time}${typeName(departure.type, language)} → ${departure.destination}`,
    MAX_TEXT_STATE,
  );
}

/**
 * The states of a watched station.
 * @param {object} gladys
 * @param {object} watch
 * @param {object[]} departures the departures of the watch (applyFilters, aged)
 * @param {string} language
 */
export function stationStates(gladys, watch, departures, language) {
  const ids = gladys.externalIds(STATION_TYPE, watchKey(watch));
  const [next, following] = departures;
  const minutes = (departure) =>
    departure ? Math.min(departure.minutes, NO_DEPARTURE_MINUTES) : NO_DEPARTURE_MINUTES;
  return [
    { device_feature_external_id: ids.feature('next'), state: minutes(next) },
    { device_feature_external_id: ids.feature('following'), state: minutes(following) },
    {
      device_feature_external_id: ids.feature('delay'),
      state: next ? Math.min(delayOf(next), NO_DEPARTURE_MINUTES) : 0,
    },
    {
      device_feature_external_id: ids.feature('destination'),
      text: departureText(next, language),
    },
  ];
}
