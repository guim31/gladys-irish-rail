# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

### Added

- A device per watched Irish Rail station (DART, commuter and intercity), with
  an optional type of train and direction filter: minutes to the next and the
  following departure, delay of the next one, and its time, type and
  destination.
- Actions to find, watch and stop watching a station, and a status.
- A _Next trains_ dashboard widget, coloured by delay.
- Scene triggers _Time to leave_ (1 to 30 minutes before a departure) and
  _Train delayed_ (5 to 60 minutes), once per train.
- A _Get the next trains_ scene action, with a sentence ready to send.
- Texts and documentation in English, French, German and Spanish.

[Unreleased]: https://github.com/guim31/gladys-irish-rail/commits/main
