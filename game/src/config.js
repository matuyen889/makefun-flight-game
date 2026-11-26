export const VIEWPORT = {
  WIDTH: 1280,
  HEIGHT: 720,
  FOV: 65,
  NEAR: 1,
  FAR: 10000
};

export const FLIGHT_PHYSICS = {
  GRAVITY: 9.81,
  AIR_DENSITY: 1.225,
  MASS: 2500,               // kg
  WING_AREA: 22.0,          // m^2
  WING_SPAN: 10.5,          // m
  MAX_THRUST: 38000,        // N
  MIN_SPEED: 40,            // knots (stall threshold)
  CRUISE_SPEED: 260,        // knots
  MAX_SPEED: 550,           // knots
  PITCH_RATE: 1.6,          // rad/s
  ROLL_RATE: 2.8,           // rad/s
  YAW_RATE: 0.7,            // rad/s
  DRAG_COEFF_ZERO: 0.024,
  LIFT_SLOPE: 4.8
};

export const COLOR_PALETTE = {
  SKY_TOP: '#0d2b45',
  SKY_HORIZON: '#203c56',
  OCEAN_DEEP: '#081c2e',
  OCEAN_SURFACE: '#12395b',
  OCEAN_SPECULAR: '#5dade2',
  TERRAIN_GRASS: '#2d5a27',
  TERRAIN_ROCK: '#4a4e51',
  TERRAIN_SAND: '#c2b280',
  RUNWAY_ASPHALT: '#1e2328',
  RUNWAY_MARKINGS: '#f4f6f7',
  RUNWAY_LIGHTS_GREEN: '#00ff66',
  RUNWAY_LIGHTS_RED: '#ff3344',
  HUD_EMERALD: '#00ff88',
  HUD_AMBER: '#ffaa00',
  HUD_WHITE: '#ffffff',
  AIRCRAFT_FUSELAGE: '#d5dbdb',
  AIRCRAFT_ACCENT: '#e74c3c',
  AIRCRAFT_CANOPY: '#3498db',
  EXHAUST_GLOW: '#ff5500',
  RING_NEON: '#00e5ff'
};
