import { Vec3 } from './math3d.js';
import { COLOR_PALETTE } from './config.js';

export class WorldTerrain {
  constructor() {
    this.runway = {
      start: new Vec3(0, 2, 500),
      end: new Vec3(0, 2, -1500),
      width: 45,
      length: 2000,
      heading: 0
    };

    // Low-poly island archipelago
    this.islands = [
      { center: new Vec3(0, 0, -500), radius: 600, height: 180, peaks: [new Vec3(250, 180, -600), new Vec3(-220, 140, -400)] },
      { center: new Vec3(-1200, 0, -2500), radius: 850, height: 350, peaks: [new Vec3(-1200, 350, -2500)] },
      { center: new Vec3(1400, 0, -3200), radius: 950, height: 420, peaks: [new Vec3(1400, 420, -3200)] },
      { center: new Vec3(200, 0, -5500), radius: 1100, height: 500, peaks: [new Vec3(200, 500, -5500), new Vec3(-300, 380, -5200)] }
    ];

    // Aerial checkpoint rings (flight corridor)
    this.rings = [
      { pos: new Vec3(0, 60, -300), radius: 25, passed: false, active: true },
      { pos: new Vec3(80, 120, -1100), radius: 28, passed: false, active: false },
      { pos: new Vec3(-150, 210, -2000), radius: 30, passed: false, active: false },
      { pos: new Vec3(-450, 290, -3100), radius: 32, passed: false, active: false },
      { pos: new Vec3(-100, 340, -4200), radius: 32, passed: false, active: false },
      { pos: new Vec3(400, 260, -5200), radius: 30, passed: false, active: false },
      { pos: new Vec3(300, 140, -3800), radius: 28, passed: false, active: false },
      { pos: new Vec3(0, 50, -1800), radius: 25, passed: false, active: false }
    ];

    this.activeRingIndex = 0;
    this.score = 0;
  }

  checkRings(planePos) {
    if (this.activeRingIndex >= this.rings.length) return false;
    const ring = this.rings[this.activeRingIndex];
    const dist = planePos.clone().sub(ring.pos).len();
    if (dist < ring.radius + 10) {
      ring.passed = true;
      this.activeRingIndex += 1;
      this.score += 500;
      if (this.activeRingIndex < this.rings.length) {
        this.rings[this.activeRingIndex].active = true;
      }
      return true; // Ring cleared
    }
    return false;
  }
}
