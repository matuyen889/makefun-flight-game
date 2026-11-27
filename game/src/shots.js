import { Vec3 } from './math3d.js';

export function setupScreenshotScene(shotName, aero, world, renderer) {
  if (shotName === '1' || shotName === 'canyon-flight') {
    // Scene 1 (THE COVER): High-speed tactical chase view banking through glowing neon ring #1 over island archipelago
    aero.position.set(20, 115, -570);
    aero.velocity.set(38, 12, -155);
    aero.rotation.set(0.08, -0.22, 0.48); // Dynamic 30-deg bank
    aero.throttle = 1.0; // Max afterburner
    world.activeRingIndex = 0;
    renderer.cameraMode = 'chase';
  } else if (shotName === '2' || shotName === 'cockpit-hud') {
    // Scene 2: Authentic first-person military cockpit HUD locked on canyon checkpoint ring
    aero.position.set(-140, 215, -1850);
    aero.velocity.set(0, -5, -165);
    aero.rotation.set(-0.03, 0.1, -0.05);
    aero.throttle = 0.88;
    world.activeRingIndex = 2;
    renderer.cameraMode = 'cockpit';
  } else if (shotName === '3' || shotName === 'runway-approach') {
    // Scene 3: Precision final approach lined up on runway threshold & PAPI lights
    aero.position.set(0, 55, 50);
    aero.velocity.set(0, -6, -115);
    aero.rotation.set(-0.04, 0, 0);
    aero.throttle = 0.50;
    world.activeRingIndex = 4;
    renderer.cameraMode = 'chase';
  } else if (shotName === '4' || shotName === 'mountain-pass') {
    // Scene 4: Extreme high-G hard banking turn between twin alpine mountain peaks
    aero.position.set(-380, 280, -2950);
    aero.velocity.set(-45, 15, -135);
    aero.rotation.set(0.12, 0.4, -0.75); // Aggressive 45-deg bank
    aero.throttle = 1.0; // Max afterburner
    world.activeRingIndex = 3;
    renderer.cameraMode = 'chase';
  }
}
