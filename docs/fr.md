# Irish Rail

Les prochains trains de vos gares en Irlande, dans Gladys : trains grandes lignes et de banlieue
d'Irish Rail et DART, en temps réel, retards compris.

Les données viennent de l'[API temps réel d'Irish Rail](https://api.irishrail.ie/realtime/),
publique et gratuite : **ni compte, ni clé**. Cette intégration n'est pas affiliée à Iarnród
Éireann / Irish Rail.

> **Développée depuis l'étranger : vos retours sont les bienvenus.** Elle a été construite et
> testée sur l'API réelle (Dublin Pearse, Dublin Heuston, Bray), pas encore en usage quotidien.

## Ce que vous obtenez

- **Un appareil par gare suivie**, filtrable par type de train (DART seulement, autres trains
  seulement) et par direction : minutes avant le prochain départ et le suivant, retard du
  prochain, et son heure, son type et sa destination (« 08:43 DART → Howth »).
- **Un widget de tableau de bord** : les prochains départs d'une gare, colorés selon le retard.
- **Deux déclencheurs de scène** : il est temps de partir (1 à 30 minutes avant un départ) et
  train en retard (5 à 60 minutes), chacun une fois par train.
- **Une action de scène** : lire les prochains départs d'une gare, avec une phrase prête à
  envoyer par message ou sur une enceinte.

## Prérequis

- Gladys Assistant 5.3.0 ou plus récent.
- Un accès Internet depuis la machine de Gladys (l'intégration appelle `api.irishrail.ie` en
  HTTPS).

## Installation

1. Dans Gladys, ouvrez **Intégrations → Installer depuis GitHub**.
2. Collez `https://github.com/guim31/gladys-irish-rail` et installez.
3. Ouvrez l'onglet **Configuration** de l'intégration pour suivre des gares (ci-dessous).

## Configuration

### Réglages

- **Langue des textes** : langue des noms de fonctionnalités, du texte de destination et des
  phrases envoyées à vos scènes (français par défaut). Les noms sont fixés à la création d'un
  appareil.
- **Intervalle de rafraîchissement** : 1, 2 ou 5 minutes. Chaque rafraîchissement lit un tableau
  des départs par gare suivie.

### Suivre une gare

1. **Chercher une gare** : tapez une partie d'un nom (« Pearse », « Connolly », « Bray »). La
   réponse liste les gares correspondantes avec leur code, par exemple `[PERSE]`.
2. **Suivre une gare** : tapez son nom ou son code. Filtres facultatifs :
   - **Type de train** : DART seulement, ou les autres trains seulement (grandes lignes et
     banlieue).
   - **Direction** : une partie de la destination ou de la direction donnée par Irish Rail —
     `Northbound`, `Southbound`, `Howth`, `Cork`…
     Un nom porté par plusieurs gares (Adamstown, Clondalkin, Kishoge…) répond par la liste de
     leurs codes : tapez celui que vous voulez.
3. Ouvrez l'onglet **Découverte** et créez l'appareil.

Une même gare peut être suivie plusieurs fois avec d'autres filtres : chacune est un appareil.

### Retirer, consulter l'état

- **Ne plus suivre une gare** : tapez le nom affiché par **État**. Son appareil reste dans Gladys
  jusqu'à ce que vous le supprimiez.
- **État** : les gares suivies, si leur appareil est créé, la dernière lecture d'Irish Rail et la
  dernière erreur.

Un échec (rien trouvé, Irish Rail injoignable) s'affiche en rouge, un succès en vert.

## Appareils

Chaque gare suivie a quatre fonctionnalités :

| Fonctionnalité                | Valeur                                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| Prochain train                | minutes avant le prochain départ ; 1440 s'il n'y en a pas en 90 min |
| Train suivant                 | minutes avant le suivant ; 1440 s'il n'y en a pas                   |
| Retard du prochain train      | minutes de retard (un train en avance est à l'heure) ; 0 sans train |
| Prochain train et destination | « 08:43 DART → Howth », ou « Aucun train dans les 90 minutes »      |

Les minutes sont le « due in » d'Irish Rail, comme sur les panneaux des gares. Les heures sont à
l'heure irlandaise. Les trains qui terminent dans la gare et ceux qui passent sans s'arrêter ne
sont pas des départs et sont écartés. Entre deux lectures, les comptes à rebours continuent
d'après la dernière réponse.

## Widgets du tableau de bord

**Prochains trains** : choisissez une gare suivie. Chaque ligne montre l'heure et la destination,
puis l'attente, le type de train et le retard : vert à l'heure, orange dès 3 minutes de retard,
rouge dès 10. Réglages : le nombre de départs affichés (3 à 10) et la légende, qui peut être
masquée. Le titre est le nom de l'appareil dans Gladys.

## Déclencheurs de scène

- **Il est temps de partir** : un train part de la gare choisie dans le nombre de minutes choisi
  (1 à 30).
- **Train en retard** : un train qui doit partir de la gare choisie atteint le retard choisi (5 à
  60 minutes).

Chaque seuil se déclenche une fois par train. Rien ne se déclenche à la première lecture après un
démarrage : ce qui était déjà au tableau n'est pas une nouvelle. Variables : gare, destination,
type de train, code du train, minutes d'attente, retard, heure prévue et heure théorique.

## Actions de scène

**Obtenir les prochains trains** : pour une gare suivie, renvoie `sentence` (« Train pour
Hazelhatch au départ de Dublin Pearse : dans 3 min, 6 min de retard, puis DART pour Bray dans 4
min. »), `station_name`, `destination`, `train_type`, `minutes`, `following_minutes`, `delay`,
`expected_time` et `scheduled_time`. Sans train, `minutes` vaut 1440 et la phrase le dit.

## Exemples de scènes

- _Chaque jour de semaine à 7 h 30_ → **Obtenir les prochains trains** (Bray, Northbound) →
  envoyer `sentence` sur votre téléphone.
- **Il est temps de partir** (Dublin Pearse, 10 min) → l'annoncer sur une enceinte.
- **Train en retard** (Heuston → Cork, 15 min) → envoyer un message avec le retard et la nouvelle
  heure.

## Données, rafraîchissement et quotas

L'intégration lit la liste des gares (`getAllStationsXML`, une fois par jour au plus, seulement
quand vous cherchez ou ajoutez une gare) et, pour les appareils créés seulement, le tableau des
départs de chaque gare (`getStationDataByCodeXML_WithNumMins`, les 90 prochaines minutes) à
l'intervalle choisi. Irish Rail ne publie pas de quota : une requête par gare et par minute au plus
garde un usage léger. Seul `/data/watch.json` est écrit : les gares suivies et leurs filtres.

## Dépannage

- **Pas de valeur sur un nouvel appareil** : attendez le prochain rafraîchissement (une minute),
  ou consultez **État**.
- **« Irish Rail est illisible »** : l'API est injoignable ou répond une page d'erreur ;
  l'intégration réessaie à chaque rafraîchissement et les comptes à rebours continuent.
- **Un train manque** : il termine dans cette gare, passe sans s'arrêter, ou part dans plus de 90
  minutes.
- **Journaux** : réglez `LOG_LEVEL=debug` pour voir chaque lecture.

## Limites

- Irish Rail seulement (grandes lignes, banlieue, DART). Le Luas, Dublin Bus et les autres services
  TFI demandent une clé de la National Transport Authority et ne sont pas couverts.
- Sur certaines lignes (Cork, Limerick, Waterford, Rosslare, Belfast…), Irish Rail ne donne que
  les horaires théoriques : le retard reste alors à 0.
- Ni numéro de quai ni suppression de train : l'API ne les publie pas.
- 10 gares suivies au plus. Les noms de fonctionnalités sont fixés à la création de l'appareil.

## Crédits

Données : [API temps réel d'Irish Rail](https://api.irishrail.ie/realtime/), Iarnród Éireann.
L'usage de cette API suit l'intégration Home Assistant `irish_rail_transport` (Apache 2.0) et la
bibliothèque `pyirishrail`. Logo de la couverture : Iarnród Éireann (marque de son
propriétaire).
