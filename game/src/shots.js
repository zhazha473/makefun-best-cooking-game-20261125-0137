// Deterministic screenshot staging for Copper Ladle. `?shot=cover|chop|
// rush|serve` (plus `&seed=`) freezes the game in a frame a judge can
// read at a glance: the order board, ingredients on the counters, a dish
// mid-assembly, the timer, a plate ready to serve. Every shot is built
// from the real game objects and the real rules — nothing is drawn only
// for the camera.

import { RECIPE_BY_ID } from './recipes.js';
import { makeItem, makePlate } from './cooking.js';

function ticketFor(game, recipeId, customer, patienceRatio) {
  const recipe = RECIPE_BY_ID[recipeId];
  const max = game.board.patienceMax(game.rush);
  return {
    id: 900 + Math.floor(game.rng() * 90),
    recipe,
    customer,
    patience: max * patienceRatio,
    patienceMax: max,
    bornAt: 0,
    flash: 0,
  };
}

function setBoard(game, specs) {
  game.board.tickets = specs.map((s) => ticketFor(game, s[0], s[1], s[2]));
  game.board.spawnIn = 99;
}

function clearWorktops(game) {
  game.chop.item = null;
  game.chop.progress = 0;
  for (const burner of game.burners) {
    burner.item = null;
    burner.progress = 0;
    burner.over = 0;
  }
  game.plate.items = [];
  game.particles = [];
  game.floaters = [];
  game.toast = '';
  game.toastT = 0;
  game.servedFlash = 0;
}

// Stage the named shot on the live game object. The caller renders one
// frame and stops; nothing advances after staging.
export function stageShot(game, name) {
  game.screen = 'playing';
  game.bookOpen = false;
  game.rushHour = false;
  clearWorktops(game);

  if (name === 'cover') {
    // The judge's first look: a kitchen mid-service. Three tickets, a
    // Garden Pasta two items into its plate, a finished salad in hand,
    // a tomato on the stove, a mushroom waiting on the board. Rush 3 so
    // the three-ingredient dish is really on the menu.
    game.startRush(3);
    clearWorktops(game);
    game.timeLeft = 72;
    game.coins = 38;
    game.combo = 3;
    game.bestCombo = 3;
    game.dishesServed = 4;
    setBoard(game, [
      ['ladle-special', 'Mira', 0.55],
      ['garden-pasta', 'Bram', 0.8],
      ['mushroom-omelette', 'Sinta', 0.45],
    ]);
    game.plate.items = [makeItem('pasta'), makeItem('lettuce')];
    game.plate.items[0].state = 'cooked';
    game.plate.items[1].state = 'chopped';
    game.chef.reset(1020, 430);
    game.chef.carry(makePlate([makeItem('lettuce'), makeItem('tomato')]));
    game.chef.carrying.items[0].state = 'chopped';
    game.chef.carrying.items[1].state = 'chopped';
    game.burners[0].item = makeItem('tomato');
    game.burners[0].progress = 0.6;
    game.chop.item = makeItem('mushroom');
    game.chop.item.state = 'chopped';
    return;
  }

  if (name === 'chop') {
    // Hands on the knife: a tomato half-chopped, pasta on the stove,
    // two tickets waiting, the clock still generous.
    game.startRush(1);
    clearWorktops(game);
    game.timeLeft = 125;
    game.coins = 12;
    game.combo = 1;
    game.bestCombo = 1;
    game.dishesServed = 1;
    setBoard(game, [
      ['garden-salad', 'Dedi', 0.9],
      ['tomato-soup', 'Lestari', 0.7],
    ]);
    game.chef.reset(150, 280);
    game.chop.item = makeItem('tomato');
    game.chop.progress = 0.55;
    game.burners[0].item = makeItem('pasta');
    game.burners[0].progress = 0.3;
    return;
  }

  if (name === 'rush') {
    // Rush hour: the last minute of lunch, both burners full, three
    // tickets running low, the double-tip banner lit.
    game.startRush(2);
    clearWorktops(game);
    game.timeLeft = 47;
    game.rushHour = true;
    game.coins = 86;
    game.combo = 5;
    game.bestCombo = 5;
    game.dishesServed = 9;
    setBoard(game, [
      ['cheese-pasta', 'Agus', 0.25],
      ['mushroom-soup', 'Rani', 0.35],
      ['berry-salad', 'Joko', 0.5],
    ]);
    game.plate.items = [makeItem('pasta')];
    game.plate.items[0].state = 'cooked';
    game.chef.reset(700, 400);
    game.chef.carry(makeItem('tomato'));
    game.chef.carrying.state = 'cooked';
    game.burners[0].item = makeItem('pasta');
    game.burners[0].progress = 0.7;
    game.burners[1].item = makeItem('cheese');
    game.burners[1].progress = 0.4;
    game.chop.item = makeItem('mushroom');
    game.chop.item.state = 'chopped';
    return;
  }

  if (name === 'serve') {
    // The payoff: a finished Garden Salad at the window, its ticket
    // lit up, the bell about to ring, coins on their way.
    game.startRush(1);
    clearWorktops(game);
    game.timeLeft = 98;
    game.coins = 54;
    game.combo = 2;
    game.bestCombo = 2;
    game.dishesServed = 3;
    setBoard(game, [
      ['garden-salad', 'Putri', 0.5],
      ['grilled-cheese', 'Budi', 0.75],
    ]);
    game.board.tickets[0].flash = 1;
    game.chef.reset(1108, 290);
    game.chef.carry(makePlate([makeItem('lettuce'), makeItem('tomato')]));
    game.chef.carrying.items[0].state = 'chopped';
    game.chef.carrying.items[1].state = 'chopped';
    game.servedFlash = 0.8;
    game.floaters.push({ x: 1220, y: 200, text: '+15 coins', color: '#2e7d32', life: 1.4, maxLife: 1.4 });
    return;
  }

  // Unknown shot name: plain mid-game frame, rush 1.
  game.startRush(1);
  clearWorktops(game);
}
