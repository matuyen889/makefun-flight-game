export class FlightInput {
  constructor() {
    this.pitch = 0;           // -1 to 1
    this.roll = 0;            // -1 to 1
    this.yaw = 0;             // -1 to 1
    this.throttleDelta = 0;   // -1 to 1
    this.toggleCam = false;

    this.keys = new Set();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyC') {
        this.toggleCam = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    // Mouse steering support
    window.addEventListener('mousemove', (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      const nx = (e.clientX - halfW) / halfW;
      const ny = (e.clientY - halfH) / halfH;
      if (Math.abs(nx) > 0.1) this.roll = Math.max(-1, Math.min(1, nx * 1.2));
      if (Math.abs(ny) > 0.1) this.pitch = Math.max(-1, Math.min(1, -ny * 1.2));
    });
  }

  update() {
    let p = 0, r = 0, y = 0, t = 0;

    // Pitch: W/S or ArrowUp/ArrowDown
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) p += 1.0; // Pull up (nose up)
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) p -= 1.0;   // Push down (nose down)

    // Roll: A/D or ArrowLeft/ArrowRight
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) r += 1.0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) r -= 1.0;

    // Yaw: Q/E
    if (this.keys.has('KeyE')) y += 1.0;
    if (this.keys.has('KeyQ')) y -= 1.0;

    // Throttle: Shift (Up) / Control or Space (Down)
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) t += 0.5;
    if (this.keys.has('ControlLeft') || this.keys.has('Space')) t -= 0.5;

    if (p !== 0) this.pitch = p;
    if (r !== 0) this.roll = r;
    this.yaw = y;
    this.throttleDelta = t;
  }
}
