// Cooking: chop, cook, assemble, serve, bin. Every action is one
// honest state change on an ingredient — raw, chopped, cooked or burnt —
// and a plate only ever holds real items the cook carried there by hand.

import { INGREDIENT_BY_ID, CHOP_SECONDS, COOK_SECONDS, BURN_SECONDS } from './recipes.js';
import { BURNERS, BOARD_SPOT, PLATE_SPOT, nearestStation } from './kitchen.js';
import { plateMatchesRecipe } from './orders.js';

export function makeItem(ingId) {
  return { ing: ingId, state: 'raw' };
}

export function makePlate(items) {
  return { plate: true, items: items ? items.slice() : [] };
}

function addFloater(game, x, y, text, color) {
  game.floaters.push({ x, y, text, color, life: 1.4, maxLife: 1.4 });
}

function addSteam(game, x, y, n, color) {
  for (let i = 0; i < n; i += 1) {
    game.particles.push({
      x: x + (game.rng() - 0.5) * 24, y: y + (game.rng() - 0.5) * 10,
      vx: (game.rng() - 0.5) * 12, vy: -22 - game.rng() * 18,
      life: 0.9, maxLife: 0.9, size: 3 + game.rng() * 4, color,
    });
  }
}

export function updateCooking(game, dt) {
  // Chopping: holding E at the board with a raw, choppable item on it.
  const nearBoard = nearestStation(game.chef.x, game.chef.y);
  if (game.chop.item && game.input.interactHeld && nearBoard && nearBoard.id === 'chopping') {
    const ing = INGREDIENT_BY_ID[game.chop.item.ing];
    if (game.chop.item.state === 'raw' && ing.chop) {
      game.chop.progress += dt / CHOP_SECONDS;
      if (Math.floor(game.chop.progress * 6) !== Math.floor((game.chop.progress - dt / CHOP_SECONDS) * 6)) {
        game.sound.chop();
      }
      if (game.chop.progress >= 1) {
        game.chop.item.state = 'chopped';
        game.chop.progress = 0;
        game.sound.chopDone();
        addSteam(game, BOARD_SPOT.x, BOARD_SPOT.y, 4, '#9ed68a');
      }
    }
  }

  // Stove burners: cook, then overcook, then burn.
  for (let i = 0; i < game.burners.length; i += 1) {
    const burner = game.burners[i];
    if (!burner.item) continue;
    if (burner.item.state === 'burnt') {
      if (game.rng() < dt * 6) addSteam(game, BURNERS[i].x, BURNERS[i].y - 8, 1, '#555');
      continue;
    }
    if (burner.item.state !== 'cooked') {
      burner.progress += dt / COOK_SECONDS;
      if (burner.progress >= 1) {
        burner.item.state = 'cooked';
        burner.progress = 0;
        burner.over = 0;
        game.sound.sizzleDone();
        addSteam(game, BURNERS[i].x, BURNERS[i].y - 10, 6, '#cfd8dc');
      }
    } else {
      burner.over += dt / BURN_SECONDS;
      if (burner.over >= 1) {
        burner.item.state = 'burnt';
        burner.over = 0;
        game.sound.burn();
        game.setToast('It burnt! Bin it and start over.');
        addSteam(game, BURNERS[i].x, BURNERS[i].y - 8, 8, '#333');
      }
    }
  }
}

// One E / Space / click at the nearest counter.
export function interactAtStation(game) {
  const station = nearestStation(game.chef.x, game.chef.y);
  if (!station) return;
  const chef = game.chef;
  if (station.id === 'pantry') {
    if (chef.handsFull) {
      game.setToast('Hands full — serve or bin something first.');
      game.sound.error();
    } else {
      game.setToast('Pick an ingredient: press 1–8 or click a bin.');
    }
    return;
  }
  if (station.id === 'chopping') return interactChopping(game);
  if (station.id === 'stove') return interactStove(game);
  if (station.id === 'assembly') return interactAssembly(game);
  if (station.id === 'service') return interactService(game);
  if (station.id === 'trash') return interactTrash(game);
}

export function pickIngredient(game, ingId) {
  const chef = game.chef;
  const station = nearestStation(chef.x, chef.y);
  if (!station || station.id !== 'pantry') return false;
  if (chef.handsFull) {
    game.setToast('Hands full — serve or bin something first.');
    game.sound.error();
    return false;
  }
  chef.carry(makeItem(ingId));
  game.sound.pickup();
  return true;
}

function interactChopping(game) {
  const chef = game.chef;
  const ing = chef.carrying && !chef.carrying.plate ? INGREDIENT_BY_ID[chef.carrying.ing] : null;
  if (!game.chop.item) {
    if (chef.carrying && !chef.carrying.plate && ing.chop && chef.carrying.state === 'raw') {
      game.chop.item = chef.dropCarried();
      game.chop.progress = 0;
      game.sound.place();
    } else if (chef.carrying && !chef.carrying.plate) {
      game.setToast(ing.chop ? 'Already chopped or cooked — no knife needed.' : 'This one never needs chopping.');
      game.sound.error();
    }
    return;
  }
  // Board is occupied.
  if (!chef.handsFull) {
    chef.carry(game.chop.item);
    game.chop.item = null;
    game.chop.progress = 0;
    game.sound.pickup();
  } else {
    game.setToast('Board is busy — pick the item up first.');
    game.sound.error();
  }
}

function interactStove(game) {
  const chef = game.chef;
  const carrying = chef.carrying;
  if (carrying && !carrying.plate) {
    const ing = INGREDIENT_BY_ID[carrying.ing];
    if (!ing.cook) {
      game.setToast(ing.name + ' never goes on the stove.');
      game.sound.error();
      return;
    }
    if (carrying.state === 'cooked' || carrying.state === 'burnt') {
      game.setToast('Already cooked — take it to the assembly counter.');
      game.sound.error();
      return;
    }
    const free = game.burners.find((b) => b.item === null);
    if (!free) {
      game.setToast('Both burners are busy.');
      game.sound.error();
      return;
    }
    free.item = chef.dropCarried();
    free.progress = 0;
    free.over = 0;
    game.sound.sizzle();
    return;
  }
  if (!chef.handsFull) {
    // Pick up the most done burner item (cooked first, then raw, then burnt).
    const order = [1, 0];
    let best = null;
    for (const idx of [0, 1]) {
      const b = game.burners[idx];
      if (b.item && b.item.state === 'cooked') { best = b; break; }
    }
    if (!best) {
      for (const idx of order) {
        const b = game.burners[idx];
        if (b.item) { best = b; break; }
      }
    }
    if (best) {
      chef.carry(best.item);
      best.item = null;
      best.progress = 0;
      best.over = 0;
      game.sound.pickup();
    }
  }
}

function interactAssembly(game) {
  const chef = game.chef;
  const carrying = chef.carrying;
  if (carrying && carrying.plate) {
    if (game.plate.items.length === 0) {
      game.plate.items = carrying.items;
      chef.dropCarried();
      game.sound.place();
    } else {
      game.setToast('The counter plate is already in use.');
      game.sound.error();
    }
    return;
  }
  if (carrying && !carrying.plate) {
    if (carrying.state === 'burnt') {
      game.setToast('Burnt food goes in the bin, not on a plate.');
      game.sound.error();
      return;
    }
    if (game.plate.items.length >= 4) {
      game.setToast('The plate is full — serve it!');
      game.sound.error();
      return;
    }
    game.plate.items.push(chef.dropCarried());
    game.sound.place();
    return;
  }
  // Empty hands: pick the plate up.
  if (game.plate.items.length > 0) {
    chef.carry(makePlate(game.plate.items));
    game.plate.items = [];
    game.sound.pickup();
  }
}

function interactService(game) {
  const chef = game.chef;
  const carrying = chef.carrying;
  if (!carrying || !carrying.plate) {
    game.setToast('Bring a finished plate to the window.');
    game.sound.error();
    return;
  }
  const ticket = game.board.findMatch(carrying.items);
  if (!ticket) {
    game.setToast('No order wants this dish — check the board.');
    game.sound.error();
    return;
  }
  const tip = game.board.tipFor(ticket, game.combo, game.rushHour);
  const earned = ticket.recipe.price + tip;
  game.coins += earned;
  game.dishesServed += 1;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.board.takeTicket(ticket);
  chef.dropCarried();
  game.sound.serve();
  game.servedFlash = 1;
  addFloater(game, 1220, 200, '+' + earned + ' coins', '#2e7d32');
  addSteam(game, 1220, 260, 8, '#ffd54f');
}

function interactTrash(game) {
  const chef = game.chef;
  if (!chef.handsFull) {
    game.setToast('Nothing to throw away.');
    return;
  }
  const wasBurnt = chef.carrying.plate
    ? chef.carrying.items.some((it) => it.state === 'burnt')
    : chef.carrying.state === 'burnt';
  chef.dropCarried();
  game.sound.trash();
  if (!wasBurnt) {
    game.combo = 0;
    game.setToast('Wasted food — the combo is gone.');
  }
}

export { PLATE_SPOT, BOARD_SPOT };
