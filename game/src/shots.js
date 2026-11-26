import { Vec3 } from './math3d.js';

export function setupScreenshotScene(shotName, aero, world, renderer) {
  if (shotName === '1' || shotName === 'runway') {
    // Scene 1: Runway threshold, afterburner lighting up, runway lights visible
    aero.position.set(0, 4, 300);
    aero.velocity.set(0, 0, -60);
    aero.rotation.set(0.04, 0, 0);
    aero.throttle = 0.95;
    renderer.cameraMode = 'chase';
  } else if (shotName === '2' || shotName === 'chase') {
    // Scene 2: High-speed chase view banking through glowing neon ring #1 over mountain
    aero.position.set(20, 85, -600);
    aero.velocity.set(30, 10, -140);
    aero.rotation.set(0.08, -0.25, 0.45); // Dynamic bank
    aero.throttle = 0.85;
    world.activeRingIndex = 0;
    renderer.cameraMode = 'chase';
  } else if (shotName === '3' || shotName === 'cockpit') {
    // Scene 3: First-person true cockpit HUD view lined up on canyon ring
    aero.position.set(-140, 215, -1850);
    aero.velocity.set(0, -5, -150);
    aero.rotation.set(-0.03, 0.1, -0.05);
    aero.throttle = 0.80;
    world.activeRingIndex = 2;
    renderer.cameraMode = 'cockpit';
  } else if (shotName === '4' || shotName === 'canyon') {
    // Scene 4: Extreme high-G hard turn between twin mountain peaks
    aero.position.set(-380, 280, -2950);
    aero.velocity.set(-45, 15, -130);
    aero.rotation.set(0.12, 0.4, -0.75); // Aggressive 45-deg bank
    aero.throttle = 1.0; // Max afterburner
    world.activeRingIndex = 3;
    renderer.cameraMode = 'chase';
  }
}
