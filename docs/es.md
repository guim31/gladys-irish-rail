# Irish Rail

Los próximos trenes de sus estaciones en Irlanda, en Gladys: trenes de larga distancia y de
cercanías de Irish Rail y el DART, en tiempo real, con retrasos.

Los datos proceden de la [API en tiempo real de Irish Rail](https://api.irishrail.ie/realtime/),
pública y gratuita: **sin cuenta ni clave**. Esta integración no está afiliada a Iarnród Éireann
/ Irish Rail.

> **Desarrollada fuera de Irlanda: sus comentarios son bienvenidos.** Se construyó y probó con la
> API real (Dublin Pearse, Dublin Heuston, Bray), aún no en uso diario.

## Lo que obtiene

- **Un dispositivo por estación seguida**, con filtro opcional por tipo de tren (solo DART, solo
  otros trenes) y por dirección: minutos hasta la próxima salida y la siguiente, retraso de la
  próxima, y su hora, tipo y destino («08:43 DART → Howth»).
- **Un widget del panel**: las próximas salidas de una estación, coloreadas según su retraso.
- **Dos desencadenantes de escena**: hora de salir (de 1 a 30 minutos antes de una salida) y tren
  con retraso (de 5 a 60 minutos), cada uno una vez por tren.
- **Una acción de escena**: leer las próximas salidas de una estación, con una frase lista para
  enviar por mensaje o a un altavoz.

## Requisitos

- Gladys Assistant 5.3.0 o posterior.
- Acceso a Internet desde el equipo de Gladys (la integración llama a `api.irishrail.ie` por
  HTTPS).

## Instalación

1. En Gladys, abra **Integraciones → Instalar desde GitHub**.
2. Pegue `https://github.com/guim31/gladys-irish-rail` e instale.
3. Abra la pestaña **Configuración** de la integración para seguir estaciones (abajo).

## Configuración

### Ajustes

- **Idioma de los textos**: idioma de los nombres de las funciones, del texto de destino y de las
  frases enviadas a sus escenas (francés por defecto). Los nombres se fijan al crear un
  dispositivo.
- **Intervalo de actualización**: 1, 2 o 5 minutos. Cada actualización lee un panel de salidas por
  estación seguida.

### Seguir una estación

1. **Buscar una estación**: escriba parte de un nombre («Pearse», «Connolly», «Bray»). La
   respuesta muestra las estaciones que coinciden con su código, por ejemplo `[PERSE]`.
2. **Seguir una estación**: escriba su nombre o su código. Filtros opcionales:
   - **Tipo de tren**: solo DART, o solo los demás trenes (larga distancia y cercanías).
   - **Dirección**: parte del destino o de la dirección que da Irish Rail — `Northbound`,
     `Southbound`, `Howth`, `Cork`…
     Un nombre compartido por varias estaciones (Adamstown, Clondalkin, Kishoge…) responde con la
     lista de sus códigos: escriba el que desee.
3. Abra la pestaña **Descubrir** y cree el dispositivo.

La misma estación puede seguirse varias veces con otros filtros: cada una es un dispositivo.

### Eliminar, consultar el estado

- **Dejar de seguir una estación**: escriba el nombre que muestra **Estado**. Su dispositivo
  permanece en Gladys hasta que lo elimine.
- **Estado**: las estaciones seguidas, si su dispositivo está creado, la última lectura de Irish
  Rail y el último error.

Un fallo (nada encontrado, Irish Rail inaccesible) aparece en rojo, un éxito en verde.

## Dispositivos

Cada estación seguida tiene cuatro funciones:

| Función                  | Valor                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| Próximo tren             | minutos hasta la próxima salida; 1440 si no hay ninguna en 90 min       |
| Tren siguiente           | minutos hasta la siguiente; 1440 si no hay ninguna                      |
| Retraso del próximo tren | minutos de retraso (un tren adelantado cuenta como puntual); 0 sin tren |
| Próximo tren y destino   | «08:43 DART → Howth», o «Ningún tren en los próximos 90 minutos»        |

Los minutos son el «due in» de Irish Rail, como en los paneles de las estaciones. Las horas son
hora de Irlanda. Los trenes que terminan en la estación y los que pasan sin parar no son salidas
y se descartan. Entre dos lecturas, las cuentas atrás continúan a partir de la última respuesta.

## Widgets del panel

**Próximos trenes**: elija una estación seguida. Cada fila muestra la hora y el destino, luego la
espera, el tipo de tren y el retraso: verde puntual, naranja desde 3 minutos de retraso, rojo
desde 10. Ajustes: el número de salidas mostradas (de 3 a 10) y la leyenda, que se puede ocultar.
El título es el nombre del dispositivo en Gladys.

## Desencadenantes de escena

- **Hora de salir**: un tren sale de la estación elegida en el número de minutos elegido (de 1 a
  30).
- **Tren con retraso**: un tren que debe salir de la estación elegida alcanza el retraso elegido
  (de 5 a 60 minutos).

Cada umbral se activa una vez por tren. Nada se activa en la primera lectura tras un arranque: lo
que ya estaba en el panel no es una novedad. Variables: estación, destino, tipo de tren, código
del tren, minutos de espera, retraso, hora prevista y hora programada.

## Acciones de escena

**Obtener los próximos trenes**: para una estación seguida, devuelve `sentence` («Tren a
Hazelhatch desde Dublin Pearse: en 3 min, 6 min de retraso, luego DART a Bray en 4 min.»),
`station_name`, `destination`, `train_type`, `minutes`, `following_minutes`, `delay`,
`expected_time` y `scheduled_time`. Sin tren, `minutes` vale 1440 y la frase lo indica.

## Ejemplos de escenas

- _Cada día laborable a las 7:30_ → **Obtener los próximos trenes** (Bray, Northbound) → enviar
  `sentence` a su teléfono.
- **Hora de salir** (Dublin Pearse, 10 min) → anunciarlo en un altavoz.
- **Tren con retraso** (Heuston → Cork, 15 min) → enviar un mensaje con el retraso y la nueva hora.

## Datos, actualización y cuotas

La integración lee la lista de estaciones (`getAllStationsXML`, una vez al día como máximo, solo
cuando busca o añade una estación) y, solo para los dispositivos creados, el panel de cada
estación (`getStationDataByCodeXML_WithNumMins`, los próximos 90 minutos) al intervalo elegido.
Irish Rail no publica ninguna cuota: una petición por estación y por minuto como máximo mantiene
un uso ligero. Solo se escribe `/data/watch.json`: las estaciones seguidas y sus filtros.

## Solución de problemas

- **Sin valor en un dispositivo nuevo**: espere a la próxima actualización (un minuto) o consulte
  **Estado**.
- **«No se puede leer Irish Rail»**: la API no responde o devuelve una página de error; la
  integración lo reintenta en cada actualización y las cuentas atrás continúan.
- **Falta un tren**: termina en esta estación, pasa sin parar o sale dentro de más de 90 minutos.
- **Registros**: configure `LOG_LEVEL=debug` para ver cada lectura.

## Límites

- Solo Irish Rail (larga distancia, cercanías, DART). Luas, Dublin Bus y los demás servicios TFI
  requieren una clave de la National Transport Authority y no están cubiertos.
- En algunas líneas (Cork, Limerick, Waterford, Rosslare, Belfast…), Irish Rail solo da los
  horarios programados: el retraso se queda entonces en 0.
- Ni número de andén ni supresiones de trenes: la API no los publica.
- 10 estaciones seguidas como máximo. Los nombres de las funciones se fijan al crear el
  dispositivo.

## Créditos

Datos: [API en tiempo real de Irish Rail](https://api.irishrail.ie/realtime/), Iarnród Éireann. El
uso de esta API sigue la integración de Home Assistant `irish_rail_transport` (Apache 2.0) y la
biblioteca `pyirishrail`. Logotipo de la portada: Iarnród Éireann (marca de su titular).
