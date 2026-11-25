// Copper Ladle: bootstrap, screens and the frame loop.
// Screens: title -> playing -> rushEnd -> playing ... -> victory.
// A run is three rushes of 150 seconds; coins, dishes and the best
// combo carry across rushes, tickets and burners do not.

import { Chef } from './chef.js';
import { Input } from './input.js';
import { OrderBoard } from './orders.js';
import { SoundBank } from './audio.js';
import { drawGame } from './render.js';
import { interactAtStation, updateCooking, pickIngredient } from './cooking.js';
import { stageShot } from './shots.js';
import { recipesForRush, RUSH_LENGTH_SECONDS, RUSH_HOUR_SECONDS, INGREDIENTS } from './recipes.js';
import { nearestStation, STATIONS, PANTRY_BINS, pointInRect } from './kitchen.js';
import { mulberry32 } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

class CopperLadleGame {
  constructor(seed) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.input = new Input(canvas);
    this.sound = new SoundBank();
    this.chef = new Chef(640, 500);
    this.screen = 'title';
    this.rush = 1;
    this.timeLeft = RUSH_LENGTH_SECONDS;
    this.coins = 0;
    this.dishesServed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.mistakes = 0;
    this.board = new OrderBoard(seed + 11);
    this.chop = { item: null, progress: 0 };
    this.burners = [
      { item: null, progress: 0, over: 0 },
      { item: null, progress: 0, over: 0 },
    ];
    this.plate = { items: [] };
    this.particles = [];
    this.floaters = [];
    this.toast = '';
    this.toastT = 0;
    this.servedFlash = 0;
    this.rushHour = false;
    this.bookOpen = false;
    this.nearestStationNow = null;
    this.menu = recipesForRush(1);
    this.rushHourAnnounced = false;
    this.lastTickSecond = -1;
  }

  get menuForRush() {
    return recipesForRush(this.rush);
  }

  setToast(text) {
    this.toast = text;
    this.toastT = 2.5;
  }

  startRush(rush) {
    this.rush = rush;
    this.menu = recipesForRush(rush);
    this.timeLeft = RUSH_LENGTH_SECONDS;
    this.rushHour = false;
    this.rushHourAnnounced = false;
    this.board = new OrderBoard(this.seed + 11 + rush * 101);
    this.chop = { item: null, progress: 0 };
    this.burners = [
      { item: null, progress: 0, over: 0 },
      { item: null, progress: 0, over: 0 },
    ];
    this.plate = { items: [] };
    this.particles = [];
    this.floaters = [];
    this.chef.reset(640, 500);
    this.screen = 'playing';
    this.bookOpen = false;
    this.setToast('Rush ' + rush + ' — ' + this.menu.length + ' dishes on the menu. Good luck!');
  }

  startRun() {
    this.coins = 0;
    this.dishesServed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.mistakes = 0;
    this.startRush(1);
  }

  endRush() {
    this.screen = this.rush >= 3 ? 'victory' : 'rushEnd';
    this.sound.rush();
  }

  update(dt) {
    if (this.screen !== 'playing' || this.bookOpen) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= RUSH_HOUR_SECONDS && !this.rushHourAnnounced) {
      this.rushHourAnnounced = true;
      this.rushHour = true;
      this.setToast('RUSH HOUR — double tips for the last minute!');
      this.sound.rush();
    }
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endRush();
      return;
    }
    const second = Math.ceil(this.timeLeft);
    if (second <= 10 && second !== this.lastTickSecond) {
      this.lastTickSecond = second;
      this.sound.tick();
    }
    const expired = this.board.update(dt, this.rush, this.rushHour);
    for (const ticket of expired) {
      this.combo = 0;
      this.mistakes += 1;
      this.setToast(ticket.customer + ' left hungry — the combo is gone.');
      this.sound.error();
    }
    this.input.interactHeld = this.input.keys.has('KeyE') || this.input.keys.has('Space');
    updateCooking(this, dt);

    // Movement: keys win over a click target.
    const mv = this.input.moveVector;
    if (mv.dx !== 0 || mv.dy !== 0) {
      this.input.moveTarget = null;
      this.chef.move(mv.dx, mv.dy, dt);
    } else if (this.input.moveTarget) {
      const arrived = this.chef.moveToward(this.input.moveTarget.x, this.input.moveTarget.y, dt);
      if (arrived) this.input.moveTarget = null;
    }
    this.nearestStationNow = nearestStation(this.chef.x, this.chef.y);

    // Mouse click: a pantry bin, a counter in reach, or a walk target.
    if (this.input.mouseClicked) {
      this.handleClick();
    }
    // Keyboard: E / Space works the counter, 1-8 pick pantry bins.
    if (this.input.wasPressed('KeyE') || this.input.wasPressed('Space')) {
      this.sound.ensure();
      interactAtStation(this);
    }
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (this.input.wasPressed('Digit' + (i + 1)) || this.input.wasPressed('Numpad' + (i + 1))) {
        pickIngredient(this, INGREDIENTS[i].id);
      }
    }

    // Particles, floaters, toast.
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i -= 1) {
      const f = this.floaters[i];
      f.life -= dt;
      f.y -= 28 * dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    if (this.toastT > 0) this.toastT -= dt;
    if (this.servedFlash > 0) this.servedFlash -= dt * 1.5;
    for (const ticket of this.board.tickets) {
      if (ticket.flash > 0) ticket.flash -= dt;
    }
  }

  handleClick() {
    this.sound.ensure();
    const x = this.input.clickX;
    const y = this.input.clickY;
    // Pantry bins first: clicking one picks that ingredient.
    if (this.nearestStationNow && this.nearestStationNow.id === 'pantry') {
      for (const bin of PANTRY_BINS) {
        if (pointInRect(x, y, { x: bin.x - 19, y: bin.y - 16, w: 38, h: 34 })) {
          pickIngredient(this, bin.ing);
          return;
        }
      }
    }
    // Clicking a counter in reach works it; anything else is a walk order.
    if (this.nearestStationNow) {
      const s = this.nearestStationNow;
      if (pointInRect(x, y, { x: s.x - 24, y: s.y - 24, w: s.w + 48, h: s.h + 48 })) {
        interactAtStation(this);
        return;
      }
    }
    this.input.moveTarget = { x, y };
  }

  handleKeys() {
    if (this.input.wasPressed('Enter')) {
      if (this.screen === 'title') this.startRun();
      else if (this.screen === 'rushEnd') this.startRush(this.rush + 1);
    }
    if (this.input.wasPressed('KeyR')) {
      if (this.screen === 'victory' || this.screen === 'rushEnd') this.startRun();
      else if (this.screen === 'playing') this.startRun();
    }
    if (this.input.wasPressed('KeyP') || this.input.wasPressed('Escape')) {
      if (this.screen === 'playing' && this.bookOpen) {
        this.bookOpen = false;
      } else if (this.screen === 'playing') {
        this.screen = 'paused';
      } else if (this.screen === 'paused') {
        this.screen = 'playing';
      }
    }
    if (this.input.wasPressed('Tab')) {
      if (this.screen === 'playing') {
        this.bookOpen = !this.bookOpen;
        this.sound.click();
      }
    }
    if (this.input.wasPressed('KeyM')) {
      this.sound.muted = !this.sound.muted;
      this.setToast(this.sound.muted ? 'Sound off.' : 'Sound on.');
    }
  }

  render() {
    drawGame(ctx, this);
    const line = this.screen === 'playing'
      ? 'Rush ' + this.rush + ', ' + Math.ceil(this.timeLeft) + ' seconds left, ' + this.coins + ' coins, ' + this.dishesServed + ' dishes served'
      : 'Copper Ladle — ' + this.screen;
    if (statusEl && statusEl.textContent !== line) statusEl.textContent = line;
  }

  frame(now, last) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    this.handleKeys();
    this.update(dt);
    this.render();
    this.input.endFrame();
  }
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get('shot') || '',
    seed: parseInt(params.get('seed') || '1', 10) || 1,
  };
}

const { shot, seed } = readParams();
const game = new CopperLadleGame(shot ? seed : Math.floor(Math.random() * 1000000) + 1);
// Debug hook for play-testing: lets a test driver read live state.
window.__copperLadle = game;

if (shot) {
  // Screenshot mode: stage the frame, draw it once, and stop. The
  // picture is the game itself, frozen mid-service.
  stageShot(game, shot);
  game.render();
} else {
  canvas.addEventListener('mousedown', () => game.sound.ensure());
  let last = performance.now();
  const loop = (now) => {
    game.frame(now, last);
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
