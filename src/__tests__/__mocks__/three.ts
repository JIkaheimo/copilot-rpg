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
  userData: { [key: string]: any } = {};

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

export class Group extends Object3D {
  constructor() {
    super();
    this.userData = {};
  }
}

export class Scene extends Object3D {
  fog: any = null;

  constructor() {
    super();
    // Create a proper fog mock that works with the DayNightCycle system
    this.fog = new Fog(0xffffff, 100, 1000);
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
  domElement: HTMLCanvasElement;
  shadowMap = { enabled: false, type: 'PCFSoftShadowMap' };
  outputColorSpace = 'srgb';
  toneMapping = 'ACESFilmicToneMapping';
  toneMappingExposure = 1.0;

  constructor(parameters?: { canvas?: HTMLCanvasElement }) {
    this.domElement = parameters?.canvas || document.createElement('canvas');
  }

  setSize(width: number, height: number): void {
    this.domElement.width = width;
    this.domElement.height = height;
  }
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
  
  setIndex(_index: BufferAttribute | number[]): this {
    // Mock implementation
    return this;
  }
  
  computeVertexNormals(): void {
    // Mock implementation
  }
  
  dispose(): void {
    // Mock implementation
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
export class ConeGeometry extends BufferGeometry {
  constructor(_radius?: number, _height?: number, _segments?: number) { super(); }
}
export class TubeGeometry extends BufferGeometry {
  constructor(_path?: any, _tubularSegments?: number, _radius?: number, _radialSegments?: number, _closed?: boolean) { super(); }
}

export class QuadraticBezierCurve3 {
  constructor(_v0?: Vector3, _v1?: Vector3, _v2?: Vector3) {}
}

export class Color {
  r = 1;
  g = 1;
  b = 1;
  
  constructor(color?: number) {
    if (color !== undefined) {
      this.setHex(color);
    }
  }
  
  setHex(value: number): this {
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    this.r = r / 255;
    this.g = g / 255;
    this.b = b / 255;
    return this;
  }
  
  getHex(): number {
    return (Math.round(this.r * 255) << 16) | (Math.round(this.g * 255) << 8) | Math.round(this.b * 255);
  }
}

export class Material {
  color?: { setHex: (value: number) => any; getHex: () => number };
  
  constructor() {
    this.color = {
      setHex: vi.fn((value: number) => {
        (this.color as any)._value = value;
        return this.color;
      }),
      getHex: vi.fn(() => (this.color as any)._value || 0xffffff)
    };
  }
  
  dispose(): void {
    // Mock implementation
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
export class MeshStandardMaterial extends Material {
  metalness: number = 0;
  roughness: number = 1;
  emissive: any;
  emissiveIntensity: number = 0;
  
  constructor(parameters?: { 
    color?: number;
    metalness?: number;
    roughness?: number;
    emissive?: any;
    emissiveIntensity?: number;
  }) {
    super();
    if (parameters?.color !== undefined && this.color) {
      this.color.setHex(parameters.color);
    }
    if (parameters?.metalness !== undefined) {
      this.metalness = parameters.metalness;
    }
    if (parameters?.roughness !== undefined) {
      this.roughness = parameters.roughness;
    }
    if (parameters?.emissive !== undefined) {
      this.emissive = parameters.emissive;
    }
    if (parameters?.emissiveIntensity !== undefined) {
      this.emissiveIntensity = parameters.emissiveIntensity;
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
  color: any;
  near: number;
  far: number;
  
  constructor(color: number, near: number, far: number) {
    this.near = near;
    this.far = far;
    // Create a proper color mock that supports setHex method
    this.color = {
      setHex: vi.fn((value: number) => {
        this.color._value = value;
        return this.color;
      }),
      _value: color
    };
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
    this.userData = {};
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
      getHex: vi.fn(() => this.color._value || 0xffffff),
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
    mapSize: { width: 512, height: 512 },
    camera: { 
      near: 0.1, 
      far: 200, 
      left: -50, 
      right: 50, 
      top: 50, 
      bottom: -50,
      updateProjectionMatrix: vi.fn()
    }
  };
  target = { position: { set: vi.fn() } };
  castShadow = false;

  constructor(color?: number, intensity?: number) {
    super(color, intensity);
    // Color mock is already set up in the base Light class
  }
}

export class PointLight extends Light {
  distance: number;
  decay: number;
  shadow = {
    mapSize: { width: 512, height: 512 },
    camera: { near: 0.1, far: 50, updateProjectionMatrix: vi.fn() }
  };
  castShadow = false;

  constructor(color?: number, intensity?: number, distance?: number, decay?: number) {
    super(color, intensity);
    this.distance = distance ?? 0;
    this.decay = decay ?? 2;
  }
}

export class SpotLight extends Light {
  distance: number;
  angle: number;
  penumbra: number;
  decay: number;
  shadow = {
    mapSize: { width: 512, height: 512 },
    camera: { near: 0.1, far: 50, updateProjectionMatrix: vi.fn() }
  };
  castShadow = false;

  constructor(color?: number, intensity?: number, distance?: number, angle?: number, penumbra?: number, decay?: number) {
    super(color, intensity);
    this.distance = distance ?? 0;
    this.angle = angle ?? Math.PI / 3;
    this.penumbra = penumbra ?? 0;
    this.decay = decay ?? 2;
  }
}

export class Texture {
  wrapS: any = RepeatWrapping;
  wrapT: any = RepeatWrapping;
  repeat = { x: 1, y: 1, set: (x: number, y: number) => { this.repeat.x = x; this.repeat.y = y; } };
  needsUpdate: boolean = false;
  fallbackColor?: number;

  constructor() {
    this.needsUpdate = false;
  }

  dispose(): void {
    // Mock implementation
  }
}

export class CanvasTexture extends Texture {
  constructor(_canvas: HTMLCanvasElement) {
    super();
  }
}

export class DataTexture extends Texture {
  constructor(_data: ArrayLike<number>, _width: number, _height: number, _format?: any) {
    super();
  }
}

// Constants
export const PCFSoftShadowMap = 'PCFSoftShadowMap';
export const SRGBColorSpace = 'srgb';
export const ACESFilmicToneMapping = 'ACESFilmicToneMapping';
export const RepeatWrapping = 'RepeatWrapping';
export const RGBAFormat = 'RGBAFormat';