import { COLOR_PALETTE } from './config.js';

export class FlightHUD {
  constructor() {
    this.visible = true;
  }

  draw(ctx, w, h, aero, world) {
    if (!this.visible) return;

    const cx = w / 2;
    const cy = h / 2;
    const speed = Math.round(aero.getSpeedKnots());
    const alt = Math.round(aero.getAltitudeFeet());
    const heading = Math.round(aero.getHeadingDeg());
    const pitch = aero.getPitchDeg();
    const roll = aero.getRollDeg();

    ctx.save();
    ctx.strokeStyle = COLOR_PALETTE.HUD_EMERALD;
    ctx.fillStyle = COLOR_PALETTE.HUD_EMERALD;
    ctx.lineWidth = 2;
    ctx.font = '14px monospace';

    // 1. Watermark / Aircraft Reference Symbol (Boresight Cross)
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.moveTo(cx - 24, cy); ctx.lineTo(cx - 10, cy);
    ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 24, cy);
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy - 5);
    ctx.stroke();

    // 2. Pitch Ladder & Artificial Horizon
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-roll * Math.PI / 180);

    const pitchPxPerDeg = 8;
    const horizonOffset = pitch * pitchPxPerDeg;

    // Horizon line
    ctx.beginPath();
    ctx.setLineDash([12, 6]);
    ctx.moveTo(-160, horizonOffset);
    ctx.lineTo(160, horizonOffset);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pitch rungs (-30 to +30 deg)
    for (let deg = -40; deg <= 40; deg += 10) {
      if (deg === 0) continue;
      const py = horizonOffset - deg * pitchPxPerDeg;
      if (Math.abs(py) > 220) continue;

      const rungWidth = 60;
      ctx.beginPath();
      ctx.moveTo(-rungWidth, py);
      ctx.lineTo(-rungWidth / 3, py);
      ctx.moveTo(rungWidth / 3, py);
      ctx.lineTo(rungWidth, py);
      // Down tick for negative pitch, up tick for positive
      const tick = deg > 0 ? 6 : -6;
      ctx.moveTo(-rungWidth, py); ctx.lineTo(-rungWidth, py + tick);
      ctx.moveTo(rungWidth, py); ctx.lineTo(rungWidth, py + tick);
      ctx.stroke();

      ctx.fillText(Math.abs(deg).toString(), rungWidth + 8, py + 4);
    }
    ctx.restore();

    // 3. Airspeed Tape (Left)
    const tapeX = cx - 240;
    ctx.strokeRect(tapeX - 70, cy - 140, 70, 280);
    ctx.textAlign = 'right';
    for (let s = speed - 50; s <= speed + 50; s += 10) {
      if (s < 0) continue;
      const sy = cy + (speed - s) * 2.8;
      if (sy > cy - 130 && sy < cy + 130) {
        ctx.beginPath();
        ctx.moveTo(tapeX - 10, sy); ctx.lineTo(tapeX, sy);
        ctx.stroke();
        ctx.fillText(s.toString(), tapeX - 14, sy + 4);
      }
    }
    // Current Speed Box
    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.fillRect(tapeX - 70, cy - 18, 70, 36);
    ctx.strokeRect(tapeX - 70, cy - 18, 70, 36);
    ctx.fillStyle = COLOR_PALETTE.HUD_WHITE;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(speed.toString(), tapeX - 12, cy + 6);
    ctx.font = '12px monospace';
    ctx.fillText('KTS', tapeX - 12, cy - 22);

    // 4. Altitude Tape (Right)
    const altX = cx + 240;
    ctx.strokeStyle = COLOR_PALETTE.HUD_EMERALD;
    ctx.strokeRect(altX, cy - 140, 80, 280);
    ctx.textAlign = 'left';
    ctx.font = '14px monospace';
    ctx.fillStyle = COLOR_PALETTE.HUD_EMERALD;
    for (let a = Math.floor(alt / 100) * 100 - 400; a <= alt + 400; a += 100) {
      if (a < 0) continue;
      const ay = cy + (alt - a) * 0.35;
      if (ay > cy - 130 && ay < cy + 130) {
        ctx.beginPath();
        ctx.moveTo(altX, ay); ctx.lineTo(altX + 10, ay);
        ctx.stroke();
        ctx.fillText(a.toString(), altX + 14, ay + 4);
      }
    }
    // Current Alt Box
    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.fillRect(altX, cy - 18, 80, 36);
    ctx.strokeRect(altX, cy - 18, 80, 36);
    ctx.fillStyle = COLOR_PALETTE.HUD_WHITE;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(alt.toString(), altX + 12, cy + 6);
    ctx.font = '12px monospace';
    ctx.fillText('FT', altX + 12, cy - 22);

    // 5. Compass Heading Tape (Top)
    const compassY = 55;
    ctx.strokeStyle = COLOR_PALETTE.HUD_EMERALD;
    ctx.strokeRect(cx - 160, compassY - 25, 320, 45);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR_PALETTE.HUD_EMERALD;
    ctx.font = '13px monospace';
    for (let hDeg = heading - 40; hDeg <= heading + 40; hDeg += 5) {
      let norm = (hDeg + 360) % 360;
      const hx = cx + (hDeg - heading) * 4;
      if (hx > cx - 150 && hx < cx + 150) {
        ctx.beginPath();
        ctx.moveTo(hx, compassY - 5); ctx.lineTo(hx, compassY + 5);
        ctx.stroke();
        if (norm % 10 === 0) {
          let label = Math.floor(norm / 10).toString().padStart(2, '0');
          if (norm === 0) label = 'N';
          if (norm === 90) label = 'E';
          if (norm === 180) label = 'S';
          if (norm === 270) label = 'W';
          ctx.fillText(label, hx, compassY - 8);
        }
      }
    }
    // Compass Pointer Caret
    ctx.beginPath();
    ctx.moveTo(cx, compassY + 20); ctx.lineTo(cx - 6, compassY + 28); ctx.lineTo(cx + 6, compassY + 28);
    ctx.closePath();
    ctx.fill();

    // 6. Flight Status, Throttle & G-Meter
    ctx.textAlign = 'left';
    ctx.font = '13px monospace';
    ctx.fillStyle = COLOR_PALETTE.HUD_EMERALD;
    ctx.fillText(`THR: ${Math.round(aero.throttle * 100)}%`, cx - 230, cy + 175);
    ctx.fillText(`G-FORCE: ${aero.gForce.toFixed(1)}G`, cx - 230, cy + 195);
    if (aero.stalled) {
      ctx.fillStyle = COLOR_PALETTE.HUD_AMBER;
      ctx.font = 'bold 20px monospace';
      ctx.fillText('STALL WARNING', cx - 75, cy + 85);
    }

    // 7. Mission Target & Score HUD
    ctx.textAlign = 'right';
    ctx.fillStyle = COLOR_PALETTE.RING_NEON;
    ctx.font = '14px monospace';
    ctx.fillText(`GATEWAY RING: ${world.activeRingIndex + 1} / ${world.rings.length}`, cx + 230, cy + 175);
    ctx.fillText(`SCORE: ${world.score}`, cx + 230, cy + 195);

    ctx.restore();
  }
}
