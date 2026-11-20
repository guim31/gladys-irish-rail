// -----------------------------------------------------------------------------
// A scenario staging both triggers on the real morning data of Dublin Pearse:
// the first read is silent, then, a minute later, every train is a minute
// closer (the "time to leave" thresholds are crossed) and the DART E211 to
// Bray reports 12 minutes of delay.
// -----------------------------------------------------------------------------

import { action, create, tick } from './world.js';

/** Resolves with the station device and the scene events fired after the first read. */
export async function stageEverything(world) {
  await action(world, 'add_station', { station: 'PERSE' });
  const station = await create(world, 'Dublin Pearse');
  const before = world.fake.sceneEvents.length;
  world.network.boards.PERSE = tick(world.network.boards.PERSE).map((record) =>
    record.Traincode.trim() === 'E211' ? { ...record, Late: '12' } : record,
  );
  world.clock.advance(60000);
  await world.service.refresh();
  return { station, events: world.fake.sceneEvents.slice(before) };
}
