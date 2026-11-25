// The cook: one pair of hands, one item at a time. That limit is the
// whole puzzle — you cannot carry the soup and the salad, so every trip
// across the kitchen is a choice about what happens first.

import { resolveCollisions } from './kitchen.js';
import { clamp } from './random.js';

export const CHEF_SPEED = 250;
export const CHEF_RADIUS = 18;

export class Chef {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dirX = 0;
    this.dirY = 1;
    this.moving = false;
    this.carrying = null; // null, an ingredient item, or {plate:true, items:[...]}
    this.walkPhase = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.dirX = 0;
    this.dirY = 1;
    this.moving = false;
    this.carrying = null;
    this.walkPhase = 0;
  }

  move(dx, dy, dt) {
    if (dx === 0 && dy === 0) {
      this.moving = false;
      return;
    }
    const len = Math.hypot(dx, dy);
    const nx = dx / len;
    const ny = dy / len;
    this.x += nx * CHEF_SPEED * dt;
    this.y += ny * CHEF_SPEED * dt;
    this.dirX = nx;
    this.dirY = ny;
    this.moving = true;
    this.walkPhase += dt * 10;
    resolveCollisions(this, CHEF_RADIUS);
  }

  // Walk toward a point (mouse click-to-move). Returns true on arrival.
  moveToward(tx, ty, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      this.moving = false;
      return true;
    }
    this.move(dx, dy, Math.min(dt, d / CHEF_SPEED));
    return false;
  }

  get handsFull() {
    return this.carrying !== null;
  }

  carry(item) {
    this.carrying = item;
  }

  dropCarried() {
    const item = this.carrying;
    this.carrying = null;
    return item;
  }

  get carryingLabel() {
    if (!this.carrying) return '';
    if (this.carrying.plate) return 'Plate';
    return this.carrying.ing;
  }
}

export function carryingIsPlate(chef) {
  return chef.carrying !== null && chef.carrying.plate === true;
}

export function clamp01(v) {
  return clamp(v, 0, 1);
}
