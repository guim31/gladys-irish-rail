// -----------------------------------------------------------------------------
// Dashboard widget (manifest `widgets`, Gladys 5.1+).
//
// - departures: the board of one watched station — a status row per departure
//   ("08:43 → Howth" / "6 min · DART · +6 min"), green on time, orange from 3
//   minutes late, red from 10; the heading is the name given in Gladys, the
//   caption the legend (can be hidden).
//
// Budget of the core: 8 components, 2 texts, a status of 10 rows at most.
// -----------------------------------------------------------------------------

import { WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { clip } from './devices.js';
import { TEXT, say, typeName } from './messages.js';
import { delayOf } from './trains.js';

export const ROW_OPTIONS = [3, 5, 8, 10];
const DEFAULT_ROWS = 5;
const MAX_LABEL = 40;

const t = (language, key, params) => say(TEXT, language, key, params);

export function delayColor(delay) {
  if (delay >= 10) {
    return WIDGET_COLORS.DANGER;
  }
  return delay >= 3 ? WIDGET_COLORS.WARNING : WIDGET_COLORS.SUCCESS;
}

/** "6 min · DART · +6 min": 40 characters at most. */
export function departureValue(departure, language) {
  const delay = delayOf(departure);
  return clip(
    `${departure.minutes} min · ${typeName(departure.type, language)} · ${
      delay > 0 ? t(language, 'late', { late: delay }) : t(language, 'onTime')
    }`,
    40,
  );
}

async function departuresContent(service, { settings, language }) {
  const ttl = Math.max(30, service.config.refreshSeconds);
  if (!settings?.station) {
    return { ttl_seconds: ttl, components: [{ type: 'text', text: t(language, 'pickStation') }] };
  }
  const found = await service.boardOf(settings.station);
  if (!found) {
    return { ttl_seconds: ttl, components: [{ type: 'text', text: t(language, 'gone') }] };
  }
  const { watch, departures } = found;
  // The name the user gave the device in Gladys, else the station.
  const device = (service.gladys.devices ?? []).find((d) => d.external_id === settings.station);
  const components = [
    { type: 'text', variant: 'heading', text: clip(device?.name || watch.name, 40) },
  ];
  if (!departures) {
    components.push({ type: 'text', variant: 'body', text: t(language, 'loading') });
    return { ttl_seconds: ttl, components };
  }
  if (departures.length === 0) {
    components.push({ type: 'text', variant: 'body', text: t(language, 'noDeparture') });
    return { ttl_seconds: ttl, components };
  }
  if (settings.show_legend !== false) {
    components.push({ type: 'text', variant: 'caption', text: t(language, 'legend') });
  }
  const rows = ROW_OPTIONS.includes(Number(settings.rows)) ? Number(settings.rows) : DEFAULT_ROWS;
  components.push({
    type: 'status',
    items: departures.slice(0, rows).map((departure) => ({
      label: clip(`${departure.time || '--:--'} → ${departure.destination}`, MAX_LABEL),
      value: departureValue(departure, language),
      color: delayColor(delayOf(departure)),
    })),
  });
  return { ttl_seconds: ttl, components };
}

export const WIDGETS = {
  departures: { get: departuresContent },
};
