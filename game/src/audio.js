export class JetAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.engineGain = null;
    this.turbineOsc = null;
    this.afterburnerNode = null;
    this.windNode = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // 1. Jet Engine Turbine Whine (Oscillator)
    this.turbineOsc = this.ctx.createOscillator();
    this.turbineOsc.type = 'sawtooth';
    this.turbineOsc.frequency.setValueAtTime(140, this.ctx.currentTime);

    const turbineFilter = this.ctx.createBiquadFilter();
    turbineFilter.type = 'bandpass';
    turbineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    turbineFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.turbineOsc.connect(turbineFilter);
    turbineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.turbineOsc.start();

    // 2. Procedural Noise Generator for Exhaust & Wind
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Afterburner Low-Frequency Roar
    const roarFilter = this.ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.afterburnerGain = this.ctx.createGain();
    this.afterburnerGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    whiteNoise.connect(roarFilter);
    roarFilter.connect(this.afterburnerGain);
    this.afterburnerGain.connect(this.ctx.destination);
    whiteNoise.start();

    this.initialized = true;
  }

  update(throttle, speedKnots) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Turbine pitch scales with throttle
    const targetFreq = 120 + throttle * 380;
    this.turbineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);

    // Afterburner roar scales nonlinearly above 70% throttle
    const abPower = Math.max(0, (throttle - 0.7) / 0.3);
    this.afterburnerGain.gain.setTargetAtTime(0.04 + abPower * 0.15, now, 0.1);
  }

  playRingChime() {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.15); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }
}
