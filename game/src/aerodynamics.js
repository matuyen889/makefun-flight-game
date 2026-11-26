import { Vec3 } from './math3d.js';
import { FLIGHT_PHYSICS } from './config.js';

export class AerodynamicsModel {
  constructor() {
    this.position = new Vec3(0, 80, 0);       // World coordinate (x: east, y: up, z: south)
    this.velocity = new Vec3(0, 0, -120);     // Initial forward flight in m/s (~233 knots)
    this.rotation = new Vec3(0, 0, 0);        // Pitch, Yaw, Roll (radians)
    this.throttle = 0.75;                     // 0.0 to 1.0 (afterburner > 0.85)
    this.gForce = 1.0;
    this.stalled = false;
    this.gearDown = false;
    this.flaps = 0.0;
    this.airbrakes = 0.0;
  }

  getSpeedKnots() {
    return this.velocity.len() * 1.94384;
  }

  getAltitudeFeet() {
    return this.position.y * 3.28084;
  }

  getHeadingDeg() {
    let deg = (this.rotation.y * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;
    return deg;
  }

  getPitchDeg() {
    return this.rotation.x * 180 / Math.PI;
  }

  getRollDeg() {
    return this.rotation.z * 180 / Math.PI;
  }

  update(dt, input) {
    // Controls: pitch, roll, yaw, throttle
    this.rotation.x += input.pitch * FLIGHT_PHYSICS.PITCH_RATE * dt;
    this.rotation.y += input.yaw * FLIGHT_PHYSICS.YAW_RATE * dt;
    this.rotation.z += input.roll * FLIGHT_PHYSICS.ROLL_RATE * dt;

    // Pitch limit (-85 to +85 deg)
    const maxPitch = (85 * Math.PI) / 180;
    this.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.rotation.x));

    // Throttle control
    this.throttle = Math.max(0.0, Math.min(1.0, this.throttle + input.throttleDelta * dt));

    // Forward vector in world space
    const cp = Math.cos(this.rotation.x);
    const sp = Math.sin(this.rotation.x);
    const cy = Math.cos(this.rotation.y);
    const sy = Math.sin(this.rotation.y);
    const cr = Math.cos(this.rotation.z);
    const sr = Math.sin(this.rotation.z);

    const fwd = new Vec3(-sy * cp, sp, -cy * cp).normalize();
    const up = new Vec3(
      cy * sr + sy * sp * cr,
      cp * cr,
      sy * sr - cy * sp * cr
    ).normalize();

    // Thrust calculation
    const thrustMagnitude = this.throttle * (FLIGHT_PHYSICS.MAX_THRUST / FLIGHT_PHYSICS.MASS);
    const thrust = fwd.clone().scale(thrustMagnitude);

    // Speed and aerodynamic forces
    const speed = this.velocity.len();
    const dynamicPressure = 0.5 * FLIGHT_PHYSICS.AIR_DENSITY * speed * speed;

    // Lift and Induced Drag
    const liftMagnitude = Math.max(0, dynamicPressure * FLIGHT_PHYSICS.WING_AREA * 0.0004);
    const lift = up.clone().scale(liftMagnitude);

    // Parasitic and total Drag
    const dragCoeff = FLIGHT_PHYSICS.DRAG_COEFF_ZERO + (this.gearDown ? 0.04 : 0) + (this.airbrakes * 0.08);
    const dragMagnitude = dynamicPressure * FLIGHT_PHYSICS.WING_AREA * dragCoeff * 0.0003;
    const drag = this.velocity.clone().normalize().scale(-dragMagnitude);

    // Gravity
    const gravity = new Vec3(0, -FLIGHT_PHYSICS.GRAVITY, 0);

    // Total Acceleration
    const accel = thrust.add(lift).add(drag).add(gravity);

    // Integrate velocity and position
    this.velocity.add(accel.scale(dt));
    this.position.add(this.velocity.clone().scale(dt));

    // Stall check
    this.stalled = this.getSpeedKnots() < FLIGHT_PHYSICS.MIN_SPEED && this.position.y > 5;
    if (this.stalled) {
      this.position.y -= 15 * dt; // Stall sink
      this.rotation.x -= 0.5 * dt; // Nose drop
    }

    // Ground collision clamp (sea level is y = 0)
    if (this.position.y < 2) {
      this.position.y = 2;
      if (this.velocity.y < -5) {
        this.velocity.y = 0; // Touchdown or hard impact
      }
    }

    // Approximate G-Force
    this.gForce = 1.0 + (liftMagnitude / FLIGHT_PHYSICS.GRAVITY);
  }
}
