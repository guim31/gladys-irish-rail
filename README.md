# Irish Rail for Gladys Assistant

A [Gladys Assistant](https://gladysassistant.com) external integration for **Ireland**: the next
trains at your stations (Irish Rail intercity and commuter trains, and the DART), in real time,
delays included, from the public [Irish Rail realtime API](https://api.irishrail.ie/realtime/). No
account, no key.

> **Developed from outside Ireland: feedback welcome.** The integration is built and tested on
> real Irish Rail answers (recorded during the Friday morning rush at Dublin Pearse, Dublin Heuston
> and Bray) and its container was run against the live API; it has not yet run in a Gladys
> installation. Please report what works and what does not in the
> [issues](https://github.com/guim31/gladys-irish-rail/issues) or on the Gladys forum.

## What it does

- **A device per watched station**, optionally filtered by type of train (DART only, other trains
  only) and direction: next and following departure (minutes), delay of the next one, and its time,
  type and destination.
- **Dashboard widget**: _Next trains_, the board of a station coloured by delay.
- **Scene triggers**: _Time to leave_ (1 to 30 minutes before a departure) and _Train delayed_ (5
  to 60 minutes late), once per train.
- **Scene action**: _Get the next trains_, with a sentence ready to send.
- Texts in English, French, German and Spanish.

The user documentation is in [`docs/en.md`](docs/en.md) ([fr](docs/fr.md), [de](docs/de.md),
[es](docs/es.md)).

## Requirements

- Gladys Assistant 5.3.0 or later, with internet access.

## Installation

1. In Gladys, open **Integrations → Install from GitHub**.
2. Paste `https://github.com/guim31/gladys-irish-rail` and install.
3. In the integration's **Configuration** tab, use **Find a station** then **Watch a station**,
   and create the device in the **Discover** tab.

## How it works

Every minute (or two, or five), for the created devices only, the integration reads the board of
each watched station (`getStationDataByCodeXML_WithNumMins`, the next 90 minutes). The station list
(`getAllStationsXML`) is read when you search or add a station, once a day at most. Trains ending at
the station or passing without stopping are left out. Only `/data/watch.json` is written: the
watched stations and their filters. Irish Rail publishes no quota; the integration sends one request
per station per refresh, and one minute is the shortest interval.

## Limits

- Irish Rail only: Luas, Dublin Bus and the other TFI services need a National Transport Authority
  key and are not covered.
- On some lines (Cork, Limerick, Waterford, Rosslare, Belfast…) Irish Rail gives the scheduled times
  only: no delay there.
- No platform numbers nor cancellations: the API does not publish them.
- Up to 10 watched stations. Feature names are set when the device is created.

## Development

```bash
npm ci
npm run format:check && npm run lint && npm test
npx -y github:GladysAssistant/integration-store --skip-image-check .
```

The tests run against the SDK's fake Gladys and real Irish Rail answers recorded in
`test/fixtures/irish-rail`; they never touch the network. See [`CLAUDE.md`](CLAUDE.md) for the
project rules.

## Credits

- Data: [Irish Rail realtime API](https://api.irishrail.ie/realtime/), Iarnród Éireann.
- Cover: the Iarnród Éireann / Irish Rail logo from
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Irish_Rail_Logo.svg) (public domain),
  on the Irish Rail green.
- Inspired by the Home Assistant
  [Irish Rail Transport](https://www.home-assistant.io/integrations/irish_rail_transport/)
  integration (Apache 2.0) and the `pyirishrail` library, and by the `gladys-tfl` integration.

Not affiliated with Iarnród Éireann / Irish Rail. The logo is a trademark of its owner.

## License

Apache-2.0
