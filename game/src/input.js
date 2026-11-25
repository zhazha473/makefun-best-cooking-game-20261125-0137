// Keyboard + mouse for Copper Ladle. WASD or arrows walk, E or Space
// works the nearest counter, 1-8 pick pantry bins, Tab opens the recipe
// book, P pauses, M mutes, R restarts the rush. A mouse click walks the
// cook to the point, or works the counter under the cursor.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
    this.clickX = 0;
    this.clickY = 0;
    this.interactHeld = false;
    this.moveTarget = null;

    window.addEventListener('keydown', (ev) => {
      if (ev.repeat) return;
      this.keys.add(ev.code);
      this.pressed.add(ev.code);
      if (ev.code === 'Space') ev.preventDefault();
      if (ev.code === 'Tab') ev.preventDefault();
    });
    window.addEventListener('keyup', (ev) => {
      this.keys.delete(ev.code);
    });
    canvas.addEventListener('mousemove', (ev) => {
      const p = this.toGameCoords(ev);
      this.mouseX = p.x;
      this.mouseY = p.y;
    });
    canvas.addEventListener('mousedown', (ev) => {
      const p = this.toGameCoords(ev);
      this.mouseX = p.x;
      this.mouseY = p.y;
      this.mouseClicked = true;
      this.clickX = p.x;
      this.clickY = p.y;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.interactHeld = false;
    });
  }

  toGameCoords(ev) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = 1280 / rect.width;
    const sy = 720 / rect.height;
    return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
  }

  // Call once per frame after the game has read the inputs.
  endFrame() {
    this.pressed.clear();
    this.mouseClicked = false;
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  get interactPressed() {
    return this.wasPressed('KeyE') || this.wasPressed('Space') || this.mouseClicked;
  }

  get moveVector() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    return { dx, dy };
  }
}
