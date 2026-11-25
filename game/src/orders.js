// The order board: tickets arrive, wait, and leave happy or angry.
// A ticket names a dish and a customer, and carries a patience bar that
// drains in real time. Serve the exact dish while patience is left and
// the customer pays the dish price plus a tip scaled by the patience
// still on the bar, the combo streak and the rush-hour double.

import { recipesForRush, CUSTOMERS } from './recipes.js';
import { mulberry32, clamp, pickFrom } from './random.js';

let ticketCounter = 0;

export class OrderBoard {
  constructor(rngSeed) {
    this.rng = mulberry32(rngSeed);
    this.tickets = [];
    this.spawnIn = 2.5;
    this.served = 0;
    this.expired = 0;
  }

  baseInterval(rush) {
    return rush === 1 ? 12 : rush === 2 ? 10 : 8;
  }

  patienceMax(rush) {
    return rush === 1 ? 48 : rush === 2 ? 42 : 36;
  }

  spawnTicket(rush) {
    const menu = recipesForRush(rush);
    const recipe = pickFrom(this.rng, menu);
    const customer = pickFrom(this.rng, CUSTOMERS);
    ticketCounter += 1;
    const ticket = {
      id: ticketCounter,
      recipe,
      customer,
      patience: this.patienceMax(rush),
      patienceMax: this.patienceMax(rush),
      bornAt: 0,
      flash: 0,
    };
    this.tickets.push(ticket);
    return ticket;
  }

  // Returns 'expired' ticket ids that left angry this tick.
  update(dt, rush, rushHour) {
    const gone = [];
    const interval = this.baseInterval(rush) * (rushHour ? 0.5 : 1);
    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.tickets.length < 3) {
      this.spawnTicket(rush);
      this.spawnIn = interval;
    }
    for (const ticket of this.tickets) {
      ticket.patience -= dt;
      if (ticket.flash > 0) ticket.flash -= dt;
    }
    for (let i = this.tickets.length - 1; i >= 0; i -= 1) {
      if (this.tickets[i].patience <= 0) {
        gone.push(this.tickets[i]);
        this.tickets.splice(i, 1);
        this.expired += 1;
      }
    }
    return gone;
  }

  // Find a ticket whose dish is exactly the plate's items.
  findMatch(plateItems) {
    for (const ticket of this.tickets) {
      if (plateMatchesRecipe(plateItems, ticket.recipe)) return ticket;
    }
    return null;
  }

  takeTicket(ticket) {
    const i = this.tickets.indexOf(ticket);
    if (i >= 0) this.tickets.splice(i, 1);
    this.served += 1;
  }

  // Tip in coins for serving this ticket now.
  tipFor(ticket, combo, rushHour) {
    const left = clamp(ticket.patience / ticket.patienceMax, 0, 1);
    const base = Math.round(ticket.recipe.price * 0.5 * left);
    const comboMult = 1 + Math.min(combo, 10) * 0.1;
    const hourMult = rushHour ? 2 : 1;
    return Math.max(1, Math.round(base * comboMult * hourMult));
  }
}

// Exact multiset match: same ingredients in the same states, no more,
// no fewer. Order inside the plate does not matter.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const wanted = recipe.needs.map((n) => n.ing + ':' + n.state).sort();
  const have = plateItems.map((it) => it.ing + ':' + it.state).sort();
  for (let i = 0; i < wanted.length; i += 1) {
    if (wanted[i] !== have[i]) return false;
  }
  return true;
}

// Which recipe, if any, is this plate one item away from completing?
// Used to tint the plate gold when it is a real dish in progress.
export function platePartialMatch(plateItems, menu) {
  if (plateItems.length === 0) return null;
  for (const recipe of menu) {
    if (recipe.needs.length < plateItems.length) continue;
    const wanted = recipe.needs.map((n) => n.ing + ':' + n.state);
    const have = plateItems.map((it) => it.ing + ':' + it.state);
    let ok = true;
    for (const h of have) {
      const idx = wanted.indexOf(h);
      if (idx < 0) { ok = false; break; }
      wanted.splice(idx, 1);
    }
    if (ok) return recipe;
  }
  return null;
}
