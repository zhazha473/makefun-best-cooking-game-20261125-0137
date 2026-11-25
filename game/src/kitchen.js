// The Copper Ladle kitchen: one small loop of counters the cook walks.
// Pantry (top) -> chopping board (left) -> stove (bottom) -> assembly
// counter (bottom) -> service window (right). The loop IS the game:
// every order is a route through these five stations, planned on foot.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 72;

export const ROOM = { x: 16, y: 84, w: 1248, h: 620 };

export const STATIONS = {
  pantry:   { id: 'pantry',   label: 'PANTRY',   x: 96,  y: 84,  w: 360, h: 56 },
  chopping:  { id: 'chopping',label: 'CHOPPING', x: 16,  y: 220, w: 88,  h: 120 },
  stove:     { id: 'stove',   label: 'STOVE',    x: 470, y: 648, w: 280, h: 56 },
  assembly:  { id: 'assembly',label: 'ASSEMBLY', x: 800, y: 648, w: 280, h: 56 },
  service:   { id: 'service', label: 'SERVICE',  x: 1176,y: 220, w: 88,  h: 140 },
  trash:     { id: 'trash',   label: 'TRASH',    x: 16,  y: 520, w: 88,  h: 72 },
};

// Two burners on the stove, one plate slot on the assembly counter.
export const BURNERS = [
  { x: 540, y: 676, r: 30 },
  { x: 680, y: 676, r: 30 },
];
export const PLATE_SPOT = { x: 940, y: 676, r: 34 };
export const BOARD_SPOT = { x: 60, y: 280, r: 30 };
export const BELL_SPOT = { x: 1220, y: 290, r: 22 };

// Pantry bins, left to right, one per ingredient, keyed 1-8.
export const PANTRY_BINS = [
  { ing: 'tomato', x: 118, y: 112 },
  { ing: 'lettuce', x: 163, y: 112 },
  { ing: 'mushroom', x: 208, y: 112 },
  { ing: 'bread', x: 253, y: 112 },
  { ing: 'cheese', x: 298, y: 112 },
  { ing: 'pasta', x: 343, y: 112 },
  { ing: 'berry', x: 388, y: 112 },
  { ing: 'egg', x: 433, y: 112 },
];

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// The nearest station the cook can reach from (x, y), or null when the
// cook is standing in open floor with no counter in reach.
export function nearestStation(x, y) {
  let best = null;
  let bestD = 92;
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    const c = stationCenter(s);
    const d = distance(x, y, c.x, c.y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Push a circle (the cook) out of every counter rectangle it overlaps.
export function resolveCollisions(entity, radius) {
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    const closestX = Math.max(s.x, Math.min(entity.x, s.x + s.w));
    const closestY = Math.max(s.y, Math.min(entity.y, s.y + s.h));
    const dx = entity.x - closestX;
    const dy = entity.y - closestY;
    const d = Math.hypot(dx, dy);
    if (d < radius && d > 0.001) {
      entity.x = closestX + (dx / d) * radius;
      entity.y = closestY + (dy / d) * radius;
    } else if (d <= 0.001) {
      entity.y = s.y + s.h + radius;
    }
  }
  entity.x = Math.max(ROOM.x + radius, Math.min(ROOM.x + ROOM.w - radius, entity.x));
  entity.y = Math.max(ROOM.y + radius, Math.min(ROOM.y + ROOM.h - radius, entity.y));
}
