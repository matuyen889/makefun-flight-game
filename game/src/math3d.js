export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    return new Vec3(x, y, z);
  }

  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const l = this.len();
    if (l > 1e-6) {
      this.x /= l;
      this.y /= l;
      this.z /= l;
    }
    return this;
  }
}

export class Mat4 {
  constructor() {
    this.elements = new Float32Array(16);
    this.identity();
  }

  identity() {
    const e = this.elements;
    e[0] = 1; e[4] = 0; e[8]  = 0; e[12] = 0;
    e[1] = 0; e[5] = 1; e[9]  = 0; e[13] = 0;
    e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
    return this;
  }

  perspective(fovYDeg, aspect, near, far) {
    const fovYRad = (fovYDeg * Math.PI) / 180;
    const f = 1.0 / Math.tan(fovYRad / 2);
    const nf = 1 / (near - far);
    const e = this.elements;
    e[0] = f / aspect; e[4] = 0; e[8] = 0;                      e[12] = 0;
    e[1] = 0;          e[5] = f; e[9] = 0;                      e[13] = 0;
    e[2] = 0;          e[6] = 0; e[10] = (far + near) * nf;     e[14] = (2 * far * near) * nf;
    e[3] = 0;          e[7] = 0; e[11] = -1;                    e[15] = 0;
    return this;
  }

  lookAt(eye, target, up) {
    const zAxis = new Vec3(eye.x - target.x, eye.y - target.y, eye.z - target.z).normalize();
    const xAxis = up.cross(zAxis).normalize();
    const yAxis = zAxis.cross(xAxis);

    const e = this.elements;
    e[0] = xAxis.x; e[4] = xAxis.y; e[8]  = xAxis.z; e[12] = -xAxis.dot(eye);
    e[1] = yAxis.x; e[5] = yAxis.y; e[9]  = yAxis.z; e[13] = -yAxis.dot(eye);
    e[2] = zAxis.x; e[6] = zAxis.y; e[10] = zAxis.z; e[14] = -zAxis.dot(eye);
    e[3] = 0;       e[7] = 0;       e[11] = 0;       e[15] = 1;
    return this;
  }

  transformPoint(v) {
    const e = this.elements;
    const x = v.x, y = v.y, z = v.z;
    const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    const invW = w !== 0 ? 1 / w : 1;
    return new Vec3(
      (e[0] * x + e[4] * y + e[8]  * z + e[12]) * invW,
      (e[1] * x + e[5] * y + e[9]  * z + e[13]) * invW,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) * invW
    );
  }
}
