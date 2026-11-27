import { Vec3, Mat4 } from './math3d.js';
import { COLOR_PALETTE, VIEWPORT } from './config.js';

export class FlightRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.viewMatrix = new Mat4();
    this.projMatrix = new Mat4();
    this.cameraMode = 'chase'; // 'chase' or 'cockpit'
    this.exhaustParticles = [];
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const aspect = this.canvas.width / this.canvas.height;
    this.projMatrix.perspective(VIEWPORT.FOV, aspect, VIEWPORT.NEAR, VIEWPORT.FAR);
  }

  project(p) {
    const viewPt = this.viewMatrix.transformPoint(p);
    if (viewPt.z >= -0.5) return null; // Behind camera
    const clipPt = this.projMatrix.transformPoint(viewPt);
    const screenX = (clipPt.x * 0.5 + 0.5) * this.canvas.width;
    const screenY = (-clipPt.y * 0.5 + 0.5) * this.canvas.height;
    return { x: screenX, y: screenY, z: viewPt.z };
  }

  updateCamera(aero) {
    const cp = Math.cos(aero.rotation.x);
    const sp = Math.sin(aero.rotation.x);
    const cy = Math.cos(aero.rotation.y);
    const sy = Math.sin(aero.rotation.y);
    const cr = Math.cos(aero.rotation.z);
    const sr = Math.sin(aero.rotation.z);

    const fwd = new Vec3(-sy * cp, sp, -cy * cp).normalize();
    const up = new Vec3(cy * sr + sy * sp * cr, cp * cr, sy * sr - cy * sp * cr).normalize();

    let eye, target;
    if (this.cameraMode === 'cockpit') {
      eye = aero.position.clone().add(fwd.clone().scale(2.5)).add(up.clone().scale(1.2));
      target = eye.clone().add(fwd.clone().scale(100));
    } else {
      // Third-person chase cam
      eye = aero.position.clone().sub(fwd.clone().scale(22)).add(up.clone().scale(5.5));
      target = aero.position.clone().add(fwd.clone().scale(15));
    }

    this.viewMatrix.lookAt(eye, target, up);
  }

  render(aero, world, hud, dt) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    this.updateCamera(aero);

    // 1. Atmosphere Gradient (Sky & Sea)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, COLOR_PALETTE.SKY_TOP);
    skyGrad.addColorStop(0.5, COLOR_PALETTE.SKY_HORIZON);
    skyGrad.addColorStop(0.52, COLOR_PALETTE.OCEAN_SURFACE);
    skyGrad.addColorStop(1.0, COLOR_PALETTE.OCEAN_DEEP);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Horizon Sun Glare Specular
    const sunPos = new Vec3(0, 800, -8000);
    const sunScreen = this.project(sunPos);
    if (sunScreen) {
      const sunGrad = ctx.createRadialGradient(sunScreen.x, sunScreen.y, 10, sunScreen.x, sunScreen.y, 220);
      sunGrad.addColorStop(0, 'rgba(255, 235, 180, 0.8)');
      sunGrad.addColorStop(0.3, 'rgba(255, 180, 100, 0.3)');
      sunGrad.addColorStop(1, 'rgba(255, 120, 50, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunScreen.x, sunScreen.y, 220, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Render Archipelago Islands
    for (const island of world.islands) {
      const pBase = this.project(island.center);
      if (!pBase) continue;

      ctx.save();
      // Draw island landmass
      const pPeak = this.project(new Vec3(island.center.x, island.height, island.center.z));
      const pLeft = this.project(new Vec3(island.center.x - island.radius, 0, island.center.z));
      const pRight = this.project(new Vec3(island.center.x + island.radius, 0, island.center.z));

      if (pPeak && pLeft && pRight) {
        ctx.fillStyle = COLOR_PALETTE.TERRAIN_GRASS;
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pPeak.x, pPeak.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.closePath();
        ctx.fill();

        // Shaded ridge
        ctx.fillStyle = COLOR_PALETTE.TERRAIN_ROCK;
        ctx.beginPath();
        ctx.moveTo(pPeak.x, pPeak.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.lineTo(pBase.x, pBase.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Render Runway
    this.renderRunway(world.runway);

    // 5. Render Checkpoint Rings
    for (let i = 0; i < world.rings.length; i++) {
      this.renderRing(world.rings[i], i === world.activeRingIndex);
    }

    // 6. Render Aircraft (in Chase View)
    if (this.cameraMode === 'chase') {
      this.renderAircraft(aero, dt);
    }

    // 7. Draw Aviation Cockpit HUD
    hud.draw(ctx, w, h, aero, world);
  }

  renderRunway(runway) {
    const ctx = this.ctx;
    const halfW = runway.width / 2;
    const p1 = this.project(new Vec3(-halfW, runway.start.y, runway.start.z));
    const p2 = this.project(new Vec3(halfW, runway.start.y, runway.start.z));
    const p3 = this.project(new Vec3(halfW, runway.end.y, runway.end.z));
    const p4 = this.project(new Vec3(-halfW, runway.end.y, runway.end.z));

    if (p1 && p2 && p3 && p4) {
      // Runway Asphalt
      ctx.fillStyle = COLOR_PALETTE.RUNWAY_ASPHALT;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();

      // Centerline Stripe
      const c1 = this.project(new Vec3(0, runway.start.y + 0.1, runway.start.z));
      const c2 = this.project(new Vec3(0, runway.end.y + 0.1, runway.end.z));
      if (c1 && c2) {
        ctx.strokeStyle = COLOR_PALETTE.RUNWAY_MARKINGS;
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Approach Edge Lights
      ctx.fillStyle = COLOR_PALETTE.RUNWAY_LIGHTS_GREEN;
      for (let z = runway.start.z; z >= runway.end.z; z -= 100) {
        const l1 = this.project(new Vec3(-halfW, runway.start.y + 0.2, z));
        const l2 = this.project(new Vec3(halfW, runway.start.y + 0.2, z));
        if (l1) { ctx.beginPath(); ctx.arc(l1.x, l1.y, 3, 0, Math.PI * 2); ctx.fill(); }
        if (l2) { ctx.beginPath(); ctx.arc(l2.x, l2.y, 3, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  }

  renderRing(ring, isActive) {
    const ctx = this.ctx;
    const center = this.project(ring.pos);
    if (!center) return;

    const r = Math.max(12, Math.min(180, (ring.radius / -center.z) * 600));

    ctx.save();
    ctx.strokeStyle = ring.passed ? 'rgba(100, 255, 100, 0.4)' : (isActive ? COLOR_PALETTE.RING_NEON : 'rgba(0, 229, 255, 0.35)');
    ctx.lineWidth = isActive ? 5 : 2;

    if (isActive) {
      ctx.shadowColor = COLOR_PALETTE.RING_NEON;
      ctx.shadowBlur = 15;
    }

    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  renderAircraft(aero, dt) {
    const ctx = this.ctx;
    const p = aero.position;
    const cp = Math.cos(aero.rotation.x);
    const sp = Math.sin(aero.rotation.x);
    const cy = Math.cos(aero.rotation.y);
    const sy = Math.sin(aero.rotation.y);
    const cr = Math.cos(aero.rotation.z);
    const sr = Math.sin(aero.rotation.z);

    const fwd = new Vec3(-sy * cp, sp, -cy * cp);
    const up = new Vec3(cy * sr + sy * sp * cr, cp * cr, sy * sr - cy * sp * cr);
    const right = fwd.cross(up);

    // Procedural Jet Mesh vertices in world space
    const nose = p.clone().add(fwd.clone().scale(4.5));
    const tail = p.clone().sub(fwd.clone().scale(4.0));
    const wingLeft = p.clone().add(right.clone().scale(-5.2)).sub(fwd.clone().scale(1.2));
    const wingRight = p.clone().add(right.clone().scale(5.2)).sub(fwd.clone().scale(1.2));
    const finTop = tail.clone().add(up.clone().scale(2.2));
    const canopy = p.clone().add(fwd.clone().scale(1.5)).add(up.clone().scale(0.8));

    const pNose = this.project(nose);
    const pTail = this.project(tail);
    const pWLeft = this.project(wingLeft);
    const pWRight = this.project(wingRight);
    const pFin = this.project(finTop);
    const pCanopy = this.project(canopy);

    if (pNose && pTail && pWLeft && pWRight) {
      ctx.save();

      // Main Delta Wing Plane
      ctx.fillStyle = COLOR_PALETTE.AIRCRAFT_FUSELAGE;
      ctx.beginPath();
      ctx.moveTo(pNose.x, pNose.y);
      ctx.lineTo(pWLeft.x, pWLeft.y);
      ctx.lineTo(pTail.x, pTail.y);
      ctx.lineTo(pWRight.x, pWRight.y);
      ctx.closePath();
      ctx.fill();

      // Wing trim & accents
      ctx.strokeStyle = COLOR_PALETTE.AIRCRAFT_ACCENT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pNose.x, pNose.y); ctx.lineTo(pWLeft.x, pWLeft.y);
      ctx.moveTo(pNose.x, pNose.y); ctx.lineTo(pWRight.x, pWRight.y);
      ctx.stroke();

      // Vertical Stabilizer / Rudder
      if (pFin) {
        ctx.fillStyle = COLOR_PALETTE.AIRCRAFT_ACCENT;
        ctx.beginPath();
        ctx.moveTo(pTail.x, pTail.y);
        ctx.lineTo(pFin.x, pFin.y);
        ctx.lineTo(pCanopy.x, pCanopy.y);
        ctx.closePath();
        ctx.fill();
      }

      // Canopy Glass
      if (pCanopy) {
        ctx.fillStyle = COLOR_PALETTE.AIRCRAFT_CANOPY;
        ctx.beginPath();
        ctx.arc(pCanopy.x, pCanopy.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Twin Afterburner Jet Flames
      if (aero.throttle > 0.3) {
        const flameLen = aero.throttle * 5.5;
        const flameTipL = tail.clone().add(right.clone().scale(-0.8)).sub(fwd.clone().scale(flameLen));
        const flameTipR = tail.clone().add(right.clone().scale(0.8)).sub(fwd.clone().scale(flameLen));
        const pFlameL = this.project(flameTipL);
        const pFlameR = this.project(flameTipR);

        if (pFlameL && pFlameR) {
          ctx.strokeStyle = aero.throttle > 0.85 ? 'rgba(0, 229, 255, 0.9)' : 'rgba(255, 120, 20, 0.9)';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(pTail.x - 3, pTail.y); ctx.lineTo(pFlameL.x, pFlameL.y);
          ctx.moveTo(pTail.x + 3, pTail.y); ctx.lineTo(pFlameR.x, pFlameR.y);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pTail.x - 3, pTail.y); ctx.lineTo(pFlameL.x, pFlameL.y);
          ctx.moveTo(pTail.x + 3, pTail.y); ctx.lineTo(pFlameR.x, pFlameR.y);
          ctx.stroke();
        }
      }

      // Dynamic Wingtip Vortex Vapor Contrails
      if (Math.abs(aero.rotation.z) > 0.2 || aero.throttle > 0.8) {
        const trailLen = 16.0;
        const trailTipL = wingLeft.clone().sub(fwd.clone().scale(trailLen)).add(new Vec3(0, 0.6, 0));
        const trailTipR = wingRight.clone().sub(fwd.clone().scale(trailLen)).add(new Vec3(0, 0.6, 0));
        const pTrailL = this.project(trailTipL);
        const pTrailR = this.project(trailTipR);

        if (pTrailL && pTrailR) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(pWLeft.x, pWLeft.y); ctx.lineTo(pTrailL.x, pTrailL.y);
          ctx.moveTo(pWRight.x, pWRight.y); ctx.lineTo(pTrailR.x, pTrailR.y);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }
}
