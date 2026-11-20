# Irish Rail

The next trains at your stations in Ireland, in Gladys: Irish Rail intercity and commuter trains
and the DART, in real time, delays included.

The data comes from the [Irish Rail realtime API](https://api.irishrail.ie/realtime/), public
and free: **no account, no key**. This integration is not affiliated with Iarnród Éireann /
Irish Rail.

> **Developed from outside Ireland: feedback welcome.** It was built and tested on the live API
> (Dublin Pearse, Dublin Heuston, Bray), not yet in daily use.

## What you get

- **A device per watched station**, optionally filtered by type of train (DART only, other trains
  only) and by direction: minutes to the next departure and to the following one, the delay of
  the next one, and its time, type and destination (“08:43 DART → Howth”).
- **A dashboard widget**: the next departures of a station, coloured by delay.
- **Two scene triggers**: time to leave (1 to 30 minutes before a departure) and train delayed
  (5 to 60 minutes late), each once per train.
- **A scene action**: read the next departures of a station, with a sentence ready to send by
  message or to a speaker.

## Requirements

- Gladys Assistant 5.3.0 or later.
- Internet access from the Gladys host (the integration calls `api.irishrail.ie` over HTTPS).

## Installation

1. In Gladys, open **Integrations → Install from GitHub**.
2. Paste `https://github.com/guim31/gladys-irish-rail` and install.
3. Open the integration's **Configuration** tab to watch stations (below).

## Configuration

### Settings

- **Language of the texts**: language of the feature names, of the destination text and of the
  sentences sent to your scenes (French by default). Feature names are set when a device is
  created.
- **Refresh interval**: 1, 2 or 5 minutes. Each refresh reads one board per watched station.

### Watching a station

1. **Find a station**: type part of a name (“Pearse”, “Connolly”, “Bray”). The answer lists the
   matching stations with their code, such as `[PERSE]`.
2. **Watch a station**: type its name or code. Optional filters:
   - **Type of train**: DART only, or the other trains only (intercity and commuter).
   - **Direction**: part of the destination or of the direction Irish Rail gives —
     `Northbound`, `Southbound`, `Howth`, `Cork`…
     A name shared by several stations (Adamstown, Clondalkin, Kishoge…) answers with the list of
     their codes: type the code you want.
3. Open the **Discover** tab and create the device.

The same station can be watched several times with other filters: each one is a device.

### Removing, checking the state

- **Stop watching a station**: type the name shown by **Status**. Its device stays in Gladys
  until you delete it.
- **Status**: the watched stations, whether their device is created, the last read of Irish Rail
  and the last error.

A failure (nothing found, Irish Rail unreachable) shows in red, a success in green.

## Devices

Each watched station has four features:

| Feature                    | Value                                                            |
| -------------------------- | ---------------------------------------------------------------- |
| Next train                 | minutes to the next departure; 1440 when none in the next 90 min |
| Following train            | minutes to the one after; 1440 when none                         |
| Delay of the next train    | minutes late (an early train counts as on time); 0 when none     |
| Next train and destination | “08:43 DART → Howth”, or “No train in the next 90 minutes”       |

The minutes are the “due in” of Irish Rail, as on the station boards. Times are Irish time.
Trains ending at the station and trains passing without stopping are not departures and are left
out. Between two reads the countdowns go on from the last answer.

## Dashboard widgets

**Next trains**: pick a watched station. Each row shows the time and destination, then the wait,
the type of train and the delay: green on time, orange from 3 minutes late, red from 10. Settings:
the number of departures shown (3 to 10) and the legend, which can be hidden. The heading is the
name of the device in Gladys.

## Scene triggers

- **Time to leave**: a train leaves the chosen station in the chosen number of minutes (1 to 30).
- **Train delayed**: a train still to leave the chosen station reaches the chosen delay (5 to 60
  minutes).

Each threshold fires once per train. Nothing fires at the first read after a start: what was
already on the board is not news. Variables: station, destination, type of train, train code,
minutes to wait, delay, expected and scheduled time.

## Scene actions

**Get the next trains**: for a watched station, returns `sentence` (“Train to Hazelhatch from
Dublin Pearse: in 3 min, 6 min late, then DART to Bray in 4 min.”), `station_name`,
`destination`, `train_type`, `minutes`, `following_minutes`, `delay`, `expected_time` and
`scheduled_time`. With no train, `minutes` is 1440 and the sentence says so.

## Scene examples

- _Every weekday at 7:30_ → **Get the next trains** (Bray, Northbound) → send `sentence` to your
  phone.
- **Time to leave** (Dublin Pearse, 10 min) → announce it on a speaker.
- **Train delayed** (Heuston → Cork, 15 min) → send a message with the delay and the new time.

## Data, refresh and quotas

The integration reads the station list (`getAllStationsXML`, once a day at most, only when you
search or add a station) and, for the created devices only, the board of each station
(`getStationDataByCodeXML_WithNumMins`, the next 90 minutes) at the chosen interval. Irish Rail
publishes no quota: one request per station per minute at most keeps the use light. Only
`/data/watch.json` is written: the stations you watch and their filters.

## Troubleshooting

- **No value on a new device**: wait for the next refresh (one minute), or check **Status**.
- **“Irish Rail cannot be read”**: the API is unreachable or answers an error page; the
  integration retries at each refresh and the countdowns go on meanwhile.
- **A train is missing**: it ends at this station, or passes without stopping, or is more than 90
  minutes away.
- **Logs**: set `LOG_LEVEL=debug` to see every read.

## Limits

- Irish Rail only (intercity, commuter, DART). Luas, Dublin Bus and the other TFI services need a
  key from the National Transport Authority and are not covered.
- On some lines (Cork, Limerick, Waterford, Rosslare, Belfast…), Irish Rail only gives the
  scheduled times: the delay then stays at 0.
- No platform numbers nor cancellations: the API does not publish them.
- Up to 10 watched stations. Feature names are set when the device is created.

## Credits

Data: [Irish Rail realtime API](https://api.irishrail.ie/realtime/), Iarnród Éireann. The use of
this API follows the Home Assistant `irish_rail_transport` integration (Apache 2.0) and the
`pyirishrail` library. Logo on the cover: Iarnród Éireann (trademark of its owner).
