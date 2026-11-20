// -----------------------------------------------------------------------------
// Texts sent from the container (feature names, action messages, widget
// contents, scene outputs), in the four languages of the Gladys interface.
// Entries are strings or functions of one parameter object. German says "du",
// Spanish "usted". Brand and place names never translate.
// -----------------------------------------------------------------------------

export const INIT_FAILED = {
  en: 'Initialisation failed, check the integration logs.',
  fr: "L'initialisation a échoué, consultez les logs de l'intégration.",
  de: 'Initialisierung fehlgeschlagen, sieh dir die Protokolle der Integration an.',
  es: 'La inicialización ha fallado, consulte los registros de la integración.',
};

// Feature names (frozen when the device is created, in the configured language).
export const NAMES = {
  en: {
    next: 'Next train',
    following: 'Following train',
    delay: 'Delay of the next train',
    destination: 'Next train and destination',
  },
  fr: {
    next: 'Prochain train',
    following: 'Train suivant',
    delay: 'Retard du prochain train',
    destination: 'Prochain train et destination',
  },
  de: {
    next: 'Nächster Zug',
    following: 'Übernächster Zug',
    delay: 'Verspätung des nächsten Zugs',
    destination: 'Nächster Zug und Ziel',
  },
  es: {
    next: 'Próximo tren',
    following: 'Tren siguiente',
    delay: 'Retraso del próximo tren',
    destination: 'Próximo tren y destino',
  },
};

// Types of train: the DART keeps its name.
export const TYPES = {
  en: { dart: 'DART', train: 'Train' },
  fr: { dart: 'DART', train: 'Train' },
  de: { dart: 'DART', train: 'Zug' },
  es: { dart: 'DART', train: 'Tren' },
};

export const TEXT = {
  en: {
    noDeparture: 'No train in the next 90 minutes',
    gone: 'This station is no longer watched: pick it again.',
    unavailable: 'Irish Rail has not been read yet: try again in a minute.',
    pickStation: 'Pick a watched station in the settings of this widget.',
    loading: 'Reading Irish Rail…',
    onTime: 'on time',
    late: ({ late }) => `+${late} min`,
    legend: 'Time · wait · delay',
    serviceDown: ({ error }) => `Irish Rail cannot be read (${error}).`,
    searchNeedText: 'Type part of a station name.',
    searchFound: ({ count }) => `${count} station(s) found:`,
    searchNone: ({ query }) => `No station matches "${query}".`,
    searchHint: 'Add one with "Watch a station", by its name or its code.',
    addUnknown: ({ query }) => `No Irish Rail station matches "${query}".`,
    addAmbiguous: 'Several stations match: type the code of the one you want.',
    alreadyWatched: ({ name }) => `${name} is already watched.`,
    tooMany: ({ max }) => `${max} stations at most: remove one first.`,
    added: ({ name }) => `${name} added. Create its device in the Discover tab of the integration.`,
    removeUnknown: ({ query }) => `No watched station is called "${query}".`,
    removeAmbiguous: 'Several watched stations match: type the full name shown in the status.',
    removed: ({ name }) => `${name} is no longer watched. Delete its device in Gladys if needed.`,
    statusNone: 'No station watched yet: use "Watch a station".',
    statusStations: ({ count }) => `${count} station(s) watched:`,
    statusCreated: 'device created',
    statusNotCreated: 'device not created yet (Discover tab)',
    statusRefreshed: ({ age }) => `Last read of Irish Rail: ${age} s ago.`,
    statusNeverRefreshed: 'Irish Rail is read once a device is created.',
    statusError: ({ error }) => `Last error: ${error}`,
    sentence: ({ type, destination, station, when, delay }) =>
      `${type} to ${destination} from ${station}: ${when}${delay}`,
    in: ({ minutes }) => `in ${minutes} min`,
    now: 'due now',
    delay: ({ late }) => `, ${late} min late`,
    then: ({ type, destination, minutes }) => `, then ${type} to ${destination} in ${minutes} min`,
    nothingAt: ({ station }) => `No train from ${station} in the next 90 minutes.`,
  },
  fr: {
    noDeparture: 'Aucun train dans les 90 minutes',
    gone: "Cette gare n'est plus suivie : choisissez-la à nouveau.",
    unavailable: "Irish Rail n'a pas encore été lu : réessayez dans une minute.",
    pickStation: 'Choisissez une gare suivie dans les réglages de ce widget.',
    loading: 'Lecture d’Irish Rail…',
    onTime: "à l'heure",
    late: ({ late }) => `+${late} min`,
    legend: 'Heure · attente · retard',
    serviceDown: ({ error }) => `Irish Rail est illisible (${error}).`,
    searchNeedText: "Tapez une partie du nom d'une gare.",
    searchFound: ({ count }) => `${count} gare(s) trouvée(s) :`,
    searchNone: ({ query }) => `Aucune gare ne correspond à « ${query} ».`,
    searchHint: 'Ajoutez-en une avec « Suivre une gare », par son nom ou son code.',
    addUnknown: ({ query }) => `Aucune gare Irish Rail ne correspond à « ${query} ».`,
    addAmbiguous: 'Plusieurs gares correspondent : tapez le code de celle que vous voulez.',
    alreadyWatched: ({ name }) => `${name} est déjà suivie.`,
    tooMany: ({ max }) => `${max} gares au maximum : retirez-en une d'abord.`,
    added: ({ name }) =>
      `${name} ajoutée. Créez son appareil dans l'onglet Découverte de l'intégration.`,
    removeUnknown: ({ query }) => `Aucune gare suivie ne s'appelle « ${query} ».`,
    removeAmbiguous:
      "Plusieurs gares suivies correspondent : tapez le nom complet affiché dans l'état.",
    removed: ({ name }) =>
      `${name} n'est plus suivie. Supprimez son appareil dans Gladys si besoin.`,
    statusNone: 'Aucune gare suivie : utilisez « Suivre une gare ».',
    statusStations: ({ count }) => `${count} gare(s) suivie(s) :`,
    statusCreated: 'appareil créé',
    statusNotCreated: 'appareil pas encore créé (onglet Découverte)',
    statusRefreshed: ({ age }) => `Dernière lecture d'Irish Rail : il y a ${age} s.`,
    statusNeverRefreshed: "Irish Rail est lu dès qu'un appareil est créé.",
    statusError: ({ error }) => `Dernière erreur : ${error}`,
    sentence: ({ type, destination, station, when, delay }) =>
      `${type} pour ${destination} au départ de ${station} : ${when}${delay}`,
    in: ({ minutes }) => `dans ${minutes} min`,
    now: 'à quai',
    delay: ({ late }) => `, ${late} min de retard`,
    then: ({ type, destination, minutes }) =>
      `, puis ${type} pour ${destination} dans ${minutes} min`,
    nothingAt: ({ station }) => `Aucun train au départ de ${station} dans les 90 minutes.`,
  },
  de: {
    noDeparture: 'Kein Zug in den nächsten 90 Minuten',
    gone: 'Dieser Bahnhof wird nicht mehr verfolgt: wähle ihn erneut.',
    unavailable: 'Irish Rail wurde noch nicht gelesen: versuch es in einer Minute erneut.',
    pickStation: 'Wähle in den Einstellungen dieses Widgets einen verfolgten Bahnhof.',
    loading: 'Irish Rail wird gelesen…',
    onTime: 'pünktlich',
    late: ({ late }) => `+${late} Min.`,
    legend: 'Uhrzeit · Wartezeit · Verspätung',
    serviceDown: ({ error }) => `Irish Rail kann nicht gelesen werden (${error}).`,
    searchNeedText: 'Gib einen Teil des Bahnhofsnamens ein.',
    searchFound: ({ count }) => `${count} Bahnhof/Bahnhöfe gefunden:`,
    searchNone: ({ query }) => `Kein Bahnhof passt zu „${query}“.`,
    searchHint: 'Füge einen mit „Bahnhof verfolgen“ hinzu, per Name oder Code.',
    addUnknown: ({ query }) => `Kein Irish-Rail-Bahnhof passt zu „${query}“.`,
    addAmbiguous: 'Mehrere Bahnhöfe passen: gib den Code des gewünschten ein.',
    alreadyWatched: ({ name }) => `${name} wird bereits verfolgt.`,
    tooMany: ({ max }) => `Höchstens ${max} Bahnhöfe: entferne zuerst einen.`,
    added: ({ name }) =>
      `${name} hinzugefügt. Lege sein Gerät im Tab „Entdecken“ der Integration an.`,
    removeUnknown: ({ query }) => `Kein verfolgter Bahnhof heißt „${query}“.`,
    removeAmbiguous:
      'Mehrere verfolgte Bahnhöfe passen: gib den vollständigen Namen aus dem Status ein.',
    removed: ({ name }) =>
      `${name} wird nicht mehr verfolgt. Lösche sein Gerät in Gladys, falls nötig.`,
    statusNone: 'Noch kein Bahnhof verfolgt: nutze „Bahnhof verfolgen“.',
    statusStations: ({ count }) => `${count} Bahnhof/Bahnhöfe verfolgt:`,
    statusCreated: 'Gerät angelegt',
    statusNotCreated: 'Gerät noch nicht angelegt (Tab „Entdecken“)',
    statusRefreshed: ({ age }) => `Letzte Abfrage von Irish Rail: vor ${age} s.`,
    statusNeverRefreshed: 'Irish Rail wird gelesen, sobald ein Gerät angelegt ist.',
    statusError: ({ error }) => `Letzter Fehler: ${error}`,
    sentence: ({ type, destination, station, when, delay }) =>
      `${type} nach ${destination} ab ${station}: ${when}${delay}`,
    in: ({ minutes }) => `in ${minutes} Min.`,
    now: 'jetzt',
    delay: ({ late }) => `, ${late} Min. Verspätung`,
    then: ({ type, destination, minutes }) =>
      `, danach ${type} nach ${destination} in ${minutes} Min.`,
    nothingAt: ({ station }) => `Kein Zug ab ${station} in den nächsten 90 Minuten.`,
  },
  es: {
    noDeparture: 'Ningún tren en los próximos 90 minutos',
    gone: 'Esta estación ya no se sigue: selecciónela de nuevo.',
    unavailable: 'Irish Rail aún no se ha leído: inténtelo de nuevo en un minuto.',
    pickStation: 'Elija una estación seguida en los ajustes de este widget.',
    loading: 'Leyendo Irish Rail…',
    onTime: 'puntual',
    late: ({ late }) => `+${late} min`,
    legend: 'Hora · espera · retraso',
    serviceDown: ({ error }) => `No se puede leer Irish Rail (${error}).`,
    searchNeedText: 'Escriba parte del nombre de una estación.',
    searchFound: ({ count }) => `${count} estación(es) encontrada(s):`,
    searchNone: ({ query }) => `Ninguna estación coincide con «${query}».`,
    searchHint: 'Añada una con «Seguir una estación», por su nombre o su código.',
    addUnknown: ({ query }) => `Ninguna estación de Irish Rail coincide con «${query}».`,
    addAmbiguous: 'Varias estaciones coinciden: escriba el código de la que desea.',
    alreadyWatched: ({ name }) => `${name} ya se sigue.`,
    tooMany: ({ max }) => `${max} estaciones como máximo: elimine una primero.`,
    added: ({ name }) =>
      `${name} añadida. Cree su dispositivo en la pestaña Descubrir de la integración.`,
    removeUnknown: ({ query }) => `Ninguna estación seguida se llama «${query}».`,
    removeAmbiguous:
      'Varias estaciones seguidas coinciden: escriba el nombre completo que aparece en el estado.',
    removed: ({ name }) =>
      `${name} ya no se sigue. Elimine su dispositivo en Gladys si es necesario.`,
    statusNone: 'Ninguna estación seguida: use «Seguir una estación».',
    statusStations: ({ count }) => `${count} estación(es) seguida(s):`,
    statusCreated: 'dispositivo creado',
    statusNotCreated: 'dispositivo aún no creado (pestaña Descubrir)',
    statusRefreshed: ({ age }) => `Última lectura de Irish Rail: hace ${age} s.`,
    statusNeverRefreshed: 'Irish Rail se lee en cuanto se crea un dispositivo.',
    statusError: ({ error }) => `Último error: ${error}`,
    sentence: ({ type, destination, station, when, delay }) =>
      `${type} a ${destination} desde ${station}: ${when}${delay}`,
    in: ({ minutes }) => `en ${minutes} min`,
    now: 'en el andén',
    delay: ({ late }) => `, ${late} min de retraso`,
    then: ({ type, destination, minutes }) => `, luego ${type} a ${destination} en ${minutes} min`,
    nothingAt: ({ station }) => `Ningún tren desde ${station} en los próximos 90 minutos.`,
  },
};

/** One text of a table in a language (English when missing). */
export function say(table, language, key, params = {}) {
  const entry = table[language]?.[key] ?? table.en[key];
  return typeof entry === 'function' ? entry(params) : entry;
}

/** One text of a table in the four languages: { en, fr, de, es }. */
export function sayAll(table, key, params = {}) {
  return Object.fromEntries(
    Object.keys(table).map((language) => [language, say(table, language, key, params)]),
  );
}

/** "DART", "Train", "Zug". */
export const typeName = (type, language) => (TYPES[language] ?? TYPES.en)[type] ?? type;

/** Thrown by an action or a scene action: Gladys shows it in red, in the user's language. */
export class ActionFailure extends Error {
  constructor(text) {
    super(text.en);
    this.message = text;
  }
}
