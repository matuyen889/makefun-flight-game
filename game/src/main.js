import { AerodynamicsModel } from './aerodynamics.js';
import { WorldTerrain } from './terrain.js';
import { FlightHUD } from './hud.js';
import { FlightRenderer } from './renderer.js';
import { FlightInput } from './input.js';
import { JetAudioSynthesizer } from './audio.js';
import { setupScreenshotScene } from './shots.js';

const canvas = document.getElementById('display');
const aero = new AerodynamicsModel();
const world = new WorldTerrain();
const hud = new FlightHUD();
const renderer = new FlightRenderer(canvas);
const input = new FlightInput();
const audio = new JetAudioSynthesizer();

renderer.resize();
window.addEventListener('resize', () => renderer.resize());

// Check if launched in screenshot mode
const params = new URLSearchParams(window.location.search);
const shotMode = params.get('shot');

if (shotMode) {
  setupScreenshotScene(shotMode, aero, world, renderer);
  renderer.render(aero, world, hud, 0.016);
  window.flightShotReady = true;
} else {
  // User interaction triggers audio context init
  window.addEventListener('click', () => audio.init(), { once: true });
  window.addEventListener('keydown', () => audio.init(), { once: true });

  let lastTime = performance.now();

  function loop(currentTime) {
    const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    input.update();

    if (input.toggleCam) {
      renderer.cameraMode = renderer.cameraMode === 'chase' ? 'cockpit' : 'chase';
      input.toggleCam = false;
    }

    aero.update(dt, input);

    if (world.checkRings(aero.position)) {
      audio.playRingChime();
    }

    audio.update(aero.throttle, aero.getSpeedKnots());

    renderer.render(aero, world, hud, dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
