// Drawing for Copper Ladle: the warm kitchen, the food, the cook, the
// tickets. Everything is drawn from code — no image files, no fonts
// from the network — so the game looks the same offline as it does here.

import { VIEW_W, VIEW_H, HUD_H, STATIONS, BURNERS, PLATE_SPOT, BOARD_SPOT, BELL_SPOT, PANTRY_BINS, stationCenter } from './kitchen.js';
import { INGREDIENT_BY_ID, RECIPES, RUSH_NAMES } from './recipes.js';
import { formatClock } from './random.js';
import { platePartialMatch } from './orders.js';

const WOOD = '#8a5a33';
const WOOD_TOP = '#b07a45';
const COPPER = '#b87333';
const COPPER_DARK = '#8a5220';
const CREAM = '#f6ead2';
const TILE_A = '#e8d5b0';
const TILE_B = '#dfc49a';
const TEAL = '#2f6f6a';
const INK = '#3a2a1a';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color || INK;
  ctx.font = (weight || '600') + ' ' + size + 'px system-ui, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function serif(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color || INK;
  ctx.font = (weight || '700') + ' ' + size + 'px Georgia, serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// One ingredient, drawn fresh at (x, y) with radius `r`. The state
// changes the drawing: chopped is sliced, cooked is golden, burnt is
// black and smoking.
export function drawIngredient(ctx, ingId, state, x, y, r) {
  const ing = INGREDIENT_BY_ID[ingId];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(0, r * 0.3);
    ctx.lineTo(r * 0.5, -r * 0.3);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const main = state === 'cooked' ? '#e8a83c' : ing.color;
  const dark = state === 'cooked' ? '#9a6a1a' : ing.dark;
  if (ingId === 'tomato') {
    ctx.fillStyle = main;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7d2c';
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(-r * 0.45, -r * 0.45); ctx.lineTo(0, -r * 0.55);
    ctx.lineTo(r * 0.45, -r * 0.45); ctx.closePath(); ctx.fill();
  } else if (ingId === 'lettuce') {
    ctx.fillStyle = main;
    for (const [ox, oy, rr] of [[-r * 0.4, 0, r * 0.62], [r * 0.4, 0, r * 0.62], [0, -r * 0.3, r * 0.62], [0, r * 0.35, r * 0.6]]) {
      ctx.beginPath(); ctx.arc(ox, oy, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = dark; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.stroke();
  } else if (ingId === 'mushroom') {
    ctx.fillStyle = '#f3e2c7';
    roundRect(ctx, -r * 0.28, -r * 0.1, r * 0.56, r * 0.85, r * 0.2); ctx.fill();
    ctx.fillStyle = main;
    ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.85, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.45, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.5, r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (ingId === 'bread') {
    ctx.fillStyle = state === 'cooked' ? '#c98a3a' : main;
    roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.45); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 2;
    roundRect(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.7); ctx.lineTo(-r * 0.5, r * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.7); ctx.lineTo(r * 0.3, r * 0.7); ctx.stroke();
  } else if (ingId === 'cheese') {
    ctx.fillStyle = main;
    ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(0, -r * 0.8); ctx.lineTo(r, r * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(-r * 0.25, r * 0.15, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill();
  } else if (ingId === 'pasta') {
    ctx.strokeStyle = main; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.35 + i * 0.28), Math.PI * (0.15 + i * 0.22), Math.PI * (1.1 + i * 0.22));
      ctx.stroke();
    }
  } else if (ingId === 'berry') {
    ctx.fillStyle = main;
    for (const [ox, oy] of [[-r * 0.4, r * 0.2], [r * 0.4, r * 0.2], [0, -r * 0.35]]) {
      ctx.beginPath(); ctx.arc(ox, oy, r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (ingId === 'egg') {
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = state === 'cooked' ? '#f2a81d' : '#f7c948';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2); ctx.fill();
  }
  if (state === 'chopped') {
    ctx.strokeStyle = 'rgba(58,42,26,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.4); ctx.lineTo(r * 0.7, r * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.4); ctx.lineTo(r * 0.7, -r * 0.4); ctx.stroke();
  }
  if (state === 'cooked') {
    ctx.strokeStyle = 'rgba(255, 220, 130, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.8, -0.6, 0.9); ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, items, glow) {
  if (glow) {
    ctx.save();
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 180);
    ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#e0d0a8';
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.stroke();
  if (items) {
    const n = items.length;
    items.forEach((item, i) => {
      const angle = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      const rr = n === 1 ? 0 : r * 0.42;
      drawIngredient(ctx, item.ing, item.state, x + Math.cos(angle) * rr, y + Math.sin(angle) * rr, r * 0.34);
    });
  }
}

function drawChef(ctx, chef) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 2 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 16, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2f6f6a';
  ctx.beginPath(); ctx.arc(0, 2, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fdf8ec';
  roundRect(ctx, -9, -4, 18, 18, 6); ctx.fill();
  ctx.strokeStyle = COPPER; ctx.lineWidth = 1.5;
  roundRect(ctx, -9, -4, 18, 18, 6); ctx.stroke();
  // Head + tall chef hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -16, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -11, -34, 22, 12, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -26, 9, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(-3.5, -17, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5, -17, 1.4, 0, Math.PI * 2); ctx.fill();
  // Carried item floats above the hat.
  if (chef.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(0, -46, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -46, 14, 0, Math.PI * 2); ctx.stroke();
    if (chef.carrying.plate) {
      drawPlate(ctx, 0, -46, 11, chef.carrying.items, false);
    } else {
      drawIngredient(ctx, chef.carrying.ing, chef.carrying.state, 0, -46, 9);
    }
  }
  ctx.restore();
}

function drawStationBase(ctx, station) {
  ctx.fillStyle = WOOD;
  roundRect(ctx, station.x, station.y, station.w, station.h, 8);
  ctx.fill();
  ctx.fillStyle = WOOD_TOP;
  roundRect(ctx, station.x + 3, station.y + 3, station.w - 6, station.h - 10, 6);
  ctx.fill();
  // The pantry bins and the assembly plate cover a centred label, so
  // those two stations get their label drawn elsewhere (see drawKitchen).
  if (station.id === 'pantry' || station.id === 'assembly') return;
  text(ctx, station.label, station.x + station.w / 2, station.y + station.h - 8, 10, '#6b4423', '700', 'center');
}

function drawKitchen(ctx, game) {
  // Floor: warm checker tiles + a rug in the middle of the loop.
  for (let ty = 0; ty < 10; ty += 1) {
    for (let tx = 0; tx < 20; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? TILE_A : TILE_B;
      ctx.fillRect(16 + tx * 62.4, 84 + ty * 62, 62.4, 62);
    }
  }
  ctx.fillStyle = '#c96f4a';
  roundRect(ctx, 480, 300, 320, 140, 18); ctx.fill();
  ctx.fillStyle = '#d98a63';
  roundRect(ctx, 494, 314, 292, 112, 12); ctx.fill();
  ctx.strokeStyle = '#f6ead2'; ctx.lineWidth = 3;
  roundRect(ctx, 508, 328, 264, 84, 8); ctx.stroke();

  // Copper pots hanging on the top wall.
  for (let i = 0; i < 5; i += 1) {
    const px = 560 + i * 44;
    ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, 84); ctx.lineTo(px, 96); ctx.stroke();
    ctx.fillStyle = COPPER;
    ctx.beginPath(); ctx.arc(px, 108, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COPPER_DARK;
    ctx.beginPath(); ctx.arc(px, 108, 6, 0, Math.PI * 2); ctx.fill();
  }

  // Pantry: eight bins along the top counter.
  drawStationBase(ctx, STATIONS.pantry);
  PANTRY_BINS.forEach((bin, i) => {
    const ing = INGREDIENT_BY_ID[bin.ing];
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, bin.x - 19, bin.y - 16, 38, 34, 6); ctx.fill();
    ctx.strokeStyle = ing.dark; ctx.lineWidth = 1.5;
    roundRect(ctx, bin.x - 19, bin.y - 16, 38, 34, 6); ctx.stroke();
    drawIngredient(ctx, bin.ing, 'raw', bin.x, bin.y - 2, 10);
    text(ctx, ing.key, bin.x, bin.y + 14, 9, '#6b4423', '700', 'center');
  });
  text(ctx, 'PANTRY', 276, 154, 10, '#6b4423', '700', 'center');

  // Chopping board.
  drawStationBase(ctx, STATIONS.chopping);
  ctx.fillStyle = '#d9b078';
  roundRect(ctx, BOARD_SPOT.x - 26, BOARD_SPOT.y - 22, 52, 44, 6); ctx.fill();
  ctx.strokeStyle = '#9a6a2a'; ctx.lineWidth = 2;
  roundRect(ctx, BOARD_SPOT.x - 26, BOARD_SPOT.y - 22, 52, 44, 6); ctx.stroke();
  if (game.chop.item) {
    drawIngredient(ctx, game.chop.item.ing, game.chop.item.state, BOARD_SPOT.x, BOARD_SPOT.y, 14);
    if (game.chop.progress > 0 && game.chop.item.state === 'raw') {
      ring(ctx, BOARD_SPOT.x, BOARD_SPOT.y, 22, game.chop.progress, '#58a83c');
    }
  } else {
    // Little knife resting on the board.
    ctx.strokeStyle = '#b8bec4'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(BOARD_SPOT.x - 16, BOARD_SPOT.y + 8); ctx.lineTo(BOARD_SPOT.x + 14, BOARD_SPOT.y - 6); ctx.stroke();
    ctx.strokeStyle = '#5b3a1e'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(BOARD_SPOT.x + 14, BOARD_SPOT.y - 6); ctx.lineTo(BOARD_SPOT.x + 20, BOARD_SPOT.y - 9); ctx.stroke();
  }

  // Stove: two burners with flames, progress rings and burn smoke.
  drawStationBase(ctx, STATIONS.stove);
  game.burners.forEach((burner, i) => {
    const b = BURNERS[i];
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
    if (burner.item) {
      const cooking = burner.item.state !== 'cooked' && burner.item.state !== 'burnt';
      if (cooking) {
        ctx.fillStyle = 'rgba(255, 140, 40, 0.85)';
        ctx.beginPath();
        ctx.arc(b.x - 8, b.y + 12, 6, 0, Math.PI * 2);
        ctx.arc(b.x + 8, b.y + 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      drawIngredient(ctx, burner.item.ing, burner.item.state, b.x, b.y - 2, 15);
      if (cooking) ring(ctx, b.x, b.y, b.r + 5, burner.progress, '#ff8c28');
      if (burner.item.state === 'cooked') ring(ctx, b.x, b.y, b.r + 5, 1 - burner.over, '#e8a83c');
      if (burner.item.state === 'burnt') {
        text(ctx, 'BURNT', b.x, b.y - b.r - 10, 10, '#d9392b', '800', 'center');
      }
    } else {
      ctx.fillStyle = '#444';
      ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill();
    }
  });

  // Assembly counter with the plate.
  drawStationBase(ctx, STATIONS.assembly);
  text(ctx, 'ASSEMBLY', STATIONS.assembly.x + 10, STATIONS.assembly.y + STATIONS.assembly.h - 8, 10, '#6b4423', '700');
  const menu = game.menu;
  const partial = platePartialMatch(game.plate.items, menu);
  const complete = game.board.findMatch(game.plate.items) !== null;
  drawPlate(ctx, PLATE_SPOT.x, PLATE_SPOT.y, PLATE_SPOT.r, game.plate.items, complete);
  if (game.plate.items.length > 0 && !complete) {
    const hint = partial ? partial.name + ' needs ' + (partial.needs.length - game.plate.items.length) + ' more' : 'No dish uses this mix';
    text(ctx, hint, PLATE_SPOT.x, PLATE_SPOT.y - PLATE_SPOT.r - 12, 11, partial ? TEAL : '#b3261e', '700', 'center');
  }
  if (complete) {
    text(ctx, 'READY TO SERVE', PLATE_SPOT.x, PLATE_SPOT.y - PLATE_SPOT.r - 12, 12, '#2e7d32', '800', 'center');
  }

  // Service window with its bell.
  drawStationBase(ctx, STATIONS.service);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, BELL_SPOT.x - 26, BELL_SPOT.y - 30, 52, 40, 6); ctx.fill();
  ctx.strokeStyle = COPPER; ctx.lineWidth = 2;
  roundRect(ctx, BELL_SPOT.x - 26, BELL_SPOT.y - 30, 52, 40, 6); ctx.stroke();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(BELL_SPOT.x, BELL_SPOT.y - 4, 12, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = COPPER;
  ctx.fillRect(BELL_SPOT.x - 2, BELL_SPOT.y + 8, 4, 5);
  if (game.servedFlash > 0) {
    ctx.save();
    ctx.globalAlpha = game.servedFlash;
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(BELL_SPOT.x, BELL_SPOT.y, 26 + (1 - game.servedFlash) * 14, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Trash bin.
  drawStationBase(ctx, STATIONS.trash);
  ctx.fillStyle = '#7a7a7a';
  roundRect(ctx, 46, 548, 28, 30, 4); ctx.fill();
  ctx.fillStyle = '#5b5b5b';
  ctx.fillRect(42, 544, 36, 6);
}

function ring(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac))); ctx.stroke();
  ctx.restore();
}

function drawTicket(ctx, ticket, x, y, w, h) {
  const ratio = Math.max(0, ticket.patience / ticket.patienceMax);
  const low = ratio < 0.3;
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = low ? '#d9392b' : '#c9b48a';
  ctx.lineWidth = low ? 3 : 2;
  roundRect(ctx, x, y, w, h, 8); ctx.stroke();
  text(ctx, ticket.recipe.name, x + 10, y + 14, 14, INK, '800');
  text(ctx, 'for ' + ticket.customer, x + 10, y + 32, 11, '#7a6a55', '600');
  // Ingredient dots.
  let ix = x + 10;
  for (const need of ticket.recipe.needs) {
    drawIngredient(ctx, need.ing, need.state, ix + 8, y + 50, 8);
    ix += 20;
  }
  text(ctx, '$' + ticket.recipe.price, x + w - 10, y + 50, 13, '#2e7d32', '800', 'right');
  // Patience bar.
  const barX = x + w - 92;
  const barY = y + 8;
  ctx.fillStyle = '#e8dcc0';
  roundRect(ctx, barX, barY, 82, 8, 4); ctx.fill();
  ctx.fillStyle = ratio > 0.5 ? '#58a83c' : ratio > 0.3 ? '#f2a81d' : '#d9392b';
  roundRect(ctx, barX, barY, 82 * ratio, 8, 4); ctx.fill();
  if (ticket.flash > 0) {
    ctx.save();
    ctx.globalAlpha = ticket.flash * 0.3;
    ctx.fillStyle = '#ffd54f';
    roundRect(ctx, x, y, w, h, 8); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = Math.min(1, ticket.flash);
    ctx.strokeStyle = '#f2a81d';
    ctx.lineWidth = 3;
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 8); ctx.stroke();
    ctx.restore();
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#f6ead2';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, HUD_H - 4, VIEW_W, 4);
  game.board.tickets.forEach((ticket, i) => {
    drawTicket(ctx, ticket, 8 + i * 304, 4, 296, 64);
  });
  const rx = 936;
  text(ctx, 'RUSH ' + game.rush + ' · ' + RUSH_NAMES[game.rush - 1], rx, 14, 11, TEAL, '800');
  const lowTime = game.timeLeft <= 30;
  serif(ctx, formatClock(game.timeLeft), rx, 44, 30, lowTime ? '#d9392b' : INK, '800');
  if (game.rushHour) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 150);
    ctx.save();
    ctx.globalAlpha = pulse;
    text(ctx, 'RUSH HOUR ×2 TIPS', rx + 150, 14, 11, '#d9392b', '800');
    ctx.restore();
  }
  // Coins.
  ctx.fillStyle = '#f2c230';
  ctx.beginPath(); ctx.arc(1120, 40, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b98a12'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(1120, 40, 13, 0, Math.PI * 2); ctx.stroke();
  text(ctx, '$', 1120, 41, 13, '#7a5a10', '800', 'center');
  text(ctx, String(game.coins), 1140, 41, 20, INK, '800');
  if (game.combo >= 2) {
    ctx.fillStyle = '#7a3fa0';
    roundRect(ctx, 1196, 26, 76, 28, 8); ctx.fill();
    text(ctx, 'COMBO ×' + game.combo, 1234, 41, 13, '#ffffff', '800', 'center');
  }
}

function drawParticles(ctx, game) {
  for (const p of game.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawFloaters(ctx, game) {
  for (const f of game.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    serif(ctx, f.text, f.x, f.y, 20, f.color, '800', 'center');
    ctx.restore();
  }
}

function drawToast(ctx, game) {
  if (!game.toast || game.toastT <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, game.toastT);
  const w = ctx.measureText(game.toast).width + 32;
  ctx.fillStyle = 'rgba(58,42,26,0.92)';
  roundRect(ctx, VIEW_W / 2 - 260, 596, 520, 34, 10); ctx.fill();
  text(ctx, game.toast, VIEW_W / 2, 614, 14, '#fff8e6', '600', 'center');
  ctx.restore();
}

function drawPrompt(ctx, game) {
  const station = game.nearestStationNow;
  if (!station || game.screen !== 'playing') return;
  const hints = {
    pantry: 'E: pantry — press 1–8 or click a bin',
    chopping: game.chop.item ? (game.chop.item.state === 'raw' ? 'Hold E: chop' : 'E: pick up') : 'E: place item to chop',
    stove: 'E: place / take from burner',
    assembly: 'E: add to plate / pick plate up',
    service: 'E: serve the plate',
    trash: 'E: throw away',
  };
  const hint = hints[station.id] || '';
  const c = stationCenter(station);
  text(ctx, hint, c.x, station.y - 12, 12, '#5b3a1e', '700', 'center');
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(30,20,10,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = COPPER; ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 16); ctx.stroke();
}

function drawTitle(ctx, game) {
  panel(ctx, 240, 110, 800, 500);
  serif(ctx, 'COPPER LADLE', 640, 168, 64, COPPER, '800', 'center');
  text(ctx, '12 dishes · 5 stations · 3 rushes · 1 perfect service', 640, 216, 17, TEAL, '700', 'center');
  const lines = [
    'Walk with WASD or arrows — or click where the cook should go.',
    'E works the nearest counter. 1–8 pick pantry ingredients.',
    'Chop it, cook it, stack it on the plate, serve it at the window.',
    'Watch the burners — food left too long burns. Tips grow with',
    'patience left, your combo, and the rush hour double.',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 268 + i * 26, 15, INK, '600', 'center'));
  const blink = 0.6 + 0.4 * Math.sin(Date.now() / 300);
  ctx.save();
  ctx.globalAlpha = blink;
  serif(ctx, 'Press ENTER or click to start', 640, 448, 22, '#2e7d32', '800', 'center');
  ctx.restore();
  text(ctx, 'Tab: recipe book · P: pause · M: mute · R: restart rush', 640, 560, 13, '#7a6a55', '600', 'center');
}

function drawRushEnd(ctx, game) {
  const last = game.rush === 3;
  panel(ctx, 340, 150, 600, 420);
  serif(ctx, last ? 'SERVICE COMPLETE' : 'RUSH ' + game.rush + ' DONE', 640, 208, 40, COPPER, '800', 'center');
  const rows = [
    ['Coins earned', '$' + game.coins],
    ['Dishes served', String(game.dishesServed)],
    ['Best combo', '×' + game.bestCombo],
    ['Orders lost', String(game.board.expired)],
  ];
  rows.forEach((row, i) => {
    text(ctx, row[0], 420, 272 + i * 36, 17, INK, '600');
    text(ctx, row[1], 860, 272 + i * 36, 17, INK, '800', 'right');
  });
  if (!last) {
    text(ctx, 'Rush ' + (game.rush + 1) + ' opens ' + (RECIPES.filter((r) => r.rush === game.rush + 1).length) + ' new dishes.', 640, 452, 15, TEAL, '700', 'center');
    const blink = 0.6 + 0.4 * Math.sin(Date.now() / 300);
    ctx.save(); ctx.globalAlpha = blink;
    serif(ctx, 'Press ENTER for the next rush', 640, 500, 20, '#2e7d32', '800', 'center');
    ctx.restore();
  } else {
    const stars = game.coins >= 220 ? 3 : game.coins >= 150 ? 2 : 1;
    serif(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 452, 36, '#f2a81d', '800', 'center');
    const blink = 0.6 + 0.4 * Math.sin(Date.now() / 300);
    ctx.save(); ctx.globalAlpha = blink;
    serif(ctx, 'Press R to cook again', 640, 512, 20, '#2e7d32', '800', 'center');
    ctx.restore();
  }
}

function drawRecipeBook(ctx, game) {
  panel(ctx, 140, 60, 1000, 600);
  serif(ctx, 'THE MENU — 12 DISHES', 640, 104, 30, COPPER, '800', 'center');
  text(ctx, 'Tab or Esc closes the book', 640, 134, 13, '#7a6a55', '600', 'center');
  RECIPES.forEach((recipe, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 170 + col * 330;
    const y = 168 + row * 108;
    ctx.fillStyle = recipe.rush <= game.rush ? '#ffffff' : '#efe6cf';
    roundRect(ctx, x, y, 310, 94, 10); ctx.fill();
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, 310, 94, 10); ctx.stroke();
    text(ctx, recipe.name, x + 12, y + 18, 15, INK, '800');
    text(ctx, '$' + recipe.price + ' · rush ' + recipe.rush, x + 298, y + 18, 12, '#2e7d32', '700', 'right');
    recipe.needs.forEach((need, j) => {
      const ix = x + 24 + j * 62;
      drawIngredient(ctx, need.ing, need.state, ix, y + 58, 13);
      const label = need.state === 'raw' ? 'raw' : need.state;
      text(ctx, label, ix, y + 84, 10, '#7a6a55', '600', 'center');
    });
  });
}

export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'title') {
    drawKitchen(ctx, game);
    drawChef(ctx, game.chef);
    drawHud(ctx, game);
    drawTitle(ctx, game);
    return;
  }
  drawKitchen(ctx, game);
  drawParticles(ctx, game);
  drawChef(ctx, game.chef);
  drawFloaters(ctx, game);
  drawHud(ctx, game);
  drawPrompt(ctx, game);
  drawToast(ctx, game);
  if (game.screen === 'paused') {
    panel(ctx, 440, 260, 400, 160);
    serif(ctx, 'PAUSED', 640, 320, 40, COPPER, '800', 'center');
    text(ctx, 'P or Esc to keep cooking', 640, 368, 15, INK, '600', 'center');
  }
  if (game.screen === 'rushEnd' || game.screen === 'victory') {
    drawRushEnd(ctx, game);
  }
  if (game.bookOpen) {
    drawRecipeBook(ctx, game);
  }
}
