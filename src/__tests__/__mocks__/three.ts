// Mock Three.js for testing
import { vi } from 'vitest';

export class Vector3 {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  add(v: Vector3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  multiply(v: Vector3): this {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  normalize(): this {
    const length = this.length();
    if (length !== 0) {
      this.multiplyScalar(1 / length);
    }
    return this;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  copy(v: Vector3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  applyEuler(_euler: Euler): this {
    // Mock implementation - just return this for chaining
    return this;
  }

  distanceTo(v: Vector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  equals(v: Vector3): boolean {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  crossVectors(a: Vector3, b: Vector3): this {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    
    return this;
  }

  addScaledVector(v: Vector3, s: number): this {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    return this;
  }

  subVectors(a: Vector3, b: Vector3): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  sub(v: Vector3): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }
}

export class Euler {
  x: number = 0;
  y: number = 0;
  z: number = 0;
  order: string = 'XYZ';

  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }

  copy(euler: Euler): this {
    this.x = euler.x;
    this.y = euler.y;
    this.z = euler.z;
    this.order = euler.order;
    return this;
  }
}

export class Object3D {
  position = new Vector3();
  rotation = new Euler();
  scale = new Vector3(1, 1, 1);
  children: Object3D[] = [];
  parent: Object3D | null = null;

  constructor() {
    this.scale.setScalar = (value: number) => {
      this.scale.x = value;
      this.scale.y = value;
      this.scale.z = value;
      return this.scale;
    };
    
    // Add rotate method to rotation
    (this.rotation as any).rotate = vi.fn();
  }

  add(object: Object3D): this {
    this.children.push(object);
    object.parent = this;
    return this;
  }

  remove(object: Object3D): this {
    const index = this.children.indexOf(object);
    if (index !== -1) {
      this.children.splice(index, 1);
      object.parent = null;
    }
    return this;
  }

  traverse(callback: (object: Object3D) => void): void {
    callback(this);
    this.children.forEach(child => child.traverse(callback));
  }

  lookAt(target: Vector3 | number, y?: number, z?: number): void {
    // Mock lookAt method for meshes/objects
    if (typeof target === 'number' && y !== undefined && z !== undefined) {
      return;
    }
    // Vector3 parameter - no calculations needed for testing
  }
}

export class Group extends Object3D {}

export class Scene extends Object3D {
  fog: any = null;

  constructor() {
    super();
    // Create a more complete fog mock
    const mockSetHex = vi.fn().mockImplementation(function(this: any, value: number) {
      this._value = value;
      return this;
    });
    
    this.fog = {
      color: {
        setHex: mockSetHex,
        _value: 0xffffff
      }
    };
  }
}

export class PerspectiveCamera extends Object3D {
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  updateProjectionMatrix(): void {
    // Mock implementation - no actual matrix calculations needed for testing
  }

  lookAt(target: Vector3 | number, y?: number, z?: number): void {
    // Mock implementation - just store the target for testing purposes
    if (typeof target === 'number' && y !== undefined && z !== undefined) {
      // Called with (x, y, z) parameters
      return;
    }
    // Called with Vector3 parameter - no actual look-at calculations needed for testing
  }

  getWorldDirection(target: Vector3): Vector3 {
    // Mock implementation - return a forward direction vector
    target.set(0, 0, -1);
    return target;
  }
}

export class WebGLRenderer {
  domElement = document.createElement('canvas');
  shadowMap = { enabled: false, type: 'PCFSoftShadowMap' };
  outputColorSpace = 'srgb';
  toneMapping = 'ACESFilmicToneMapping';
  toneMappingExposure = 1.0;

  constructor(_parameters?: any) {}

  setSize(_width: number, _height: number): void {}
  setPixelRatio(_pixelRatio: number): void {}
  render(_scene: Scene, _camera: PerspectiveCamera): void {}
}

export class BufferAttribute {
  array: ArrayLike<number>;
  itemSize: number;
  
  constructor(array: ArrayLike<number>, itemSize: number) {
    this.array = array;
    this.itemSize = itemSize;
  }
}

export class Geometry {}
export class BufferGeometry extends Geometry {
  attributes: { [name: string]: BufferAttribute } = {};
  
  setAttribute(name: string, attribute: BufferAttribute): this {
    this.attributes[name] = attribute;
    return this;
  }
}
export class PlaneGeometry extends BufferGeometry {
  constructor(_width?: number, _height?: number) { super(); }
}
export class CapsuleGeometry extends BufferGeometry {
  constructor(_radius?: number, _height?: number) { super(); }
}
export class SphereGeometry extends BufferGeometry {
  constructor(_radius?: number) { super(); }
}
export class BoxGeometry extends BufferGeometry {
  constructor(_width?: number, _height?: number, _depth?: number) { super(); }
}
export class CylinderGeometry extends BufferGeometry {
  constructor(_radiusTop?: number, _radiusBottom?: number, _height?: number) { super(); }
}
export class DodecahedronGeometry extends BufferGeometry {
  constructor(_radius?: number) { super(); }
}

export class Material {
  color?: { setHex: (value: number) => any };
  
  constructor() {
    this.color = {
      setHex: vi.fn((value: number) => {
        (this.color as any)._value = value;
        return this.color;
      })
    };
  }
}
export class MeshLambertMaterial extends Material {
  constructor(parameters?: { color?: number }) {
    super();
    if (parameters?.color !== undefined && this.color) {
      this.color.setHex(parameters.color);
    }
  }
}
export class MeshBasicMaterial extends Material {
  constructor(parameters?: { color?: number }) {
    super();
    if (parameters?.color !== undefined && this.color) {
      this.color.setHex(parameters.color);
    }
  }
}
export class PointsMaterial extends Material {
  opacity: number = 1;
  transparent: boolean = false;
  
  constructor(parameters?: any) {
    super();
    if (parameters?.opacity !== undefined) {
      this.opacity = parameters.opacity;
    }
    if (parameters?.transparent !== undefined) {
      this.transparent = parameters.transparent;
    }
  }
}

export class Points extends Object3D {
  geometry: BufferGeometry;
  material: Material;
  
  constructor(geometry: BufferGeometry, material: Material) {
    super();
    this.geometry = geometry;
    this.material = material;
  }
}

export class Fog {
  color: number;
  near: number;
  far: number;
  
  constructor(color: number, near: number, far: number) {
    this.color = color;
    this.near = near;
    this.far = far;
  }
}

export class Mesh extends Object3D {
  geometry: BufferGeometry;
  material: Material;
  castShadow = false;
  receiveShadow = false;

  constructor(geometry: BufferGeometry, material: Material) {
    super();
    this.geometry = geometry;
    this.material = material;
  }

  rotate = vi.fn();
}

export class Light extends Object3D {
  color: any;
  intensity: number;

  constructor(color?: number, intensity?: number) {
    super();
    this.intensity = intensity ?? 1;
    // Create a proper color mock that supports setHex method
    this.color = {
      setHex: vi.fn((value: number) => {
        this.color._value = value;
        return this.color;
      }),
      _value: color ?? 0xffffff
    };
  }
}

export class AmbientLight extends Light {
  constructor(color?: number, intensity?: number) {
    super(color, intensity);
    // Color mock is already set up in the base Light class
  }
}

export class DirectionalLight extends Light {
  shadow = {
    mapSize: { width: 512, height: 512 }
  };
  castShadow = false;

  constructor(color?: number, intensity?: number) {
    super(color, intensity);
    // Color mock is already set up in the base Light class
  }
}

// Constants
export const PCFSoftShadowMap = 'PCFSoftShadowMap';
export const SRGBColorSpace = 'srgb';
export const ACESFilmicToneMapping = 'ACESFilmicToneMapping';