import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Shield } from 'lucide-react';
import {
  afterDraw,
  applyStudioEnvironment,
  checkWebGLSupport,
  detectSoftwareGl,
  disposeSceneResources,
} from './webglUtils';

interface ThreeDSecurityCoreProps {
  posture: 'Elevated' | 'Guarded' | 'Nominal';
  reducedMotion: boolean;
  className?: string;
}

function createShieldShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1.38 * scale);
  s.bezierCurveTo(0.45 * scale, 1.38 * scale, 0.92 * scale, 1.18 * scale, 1.08 * scale, 1.02 * scale);
  s.bezierCurveTo(1.06 * scale, 0.25 * scale, 0.88 * scale, -0.58 * scale, 0, -1.35 * scale);
  s.bezierCurveTo(-0.88 * scale, -0.58 * scale, -1.06 * scale, 0.25 * scale, -1.08 * scale, 1.02 * scale);
  s.bezierCurveTo(-0.92 * scale, 1.18 * scale, -0.45 * scale, 1.38 * scale, 0, 1.38 * scale);
  return s;
}

function createShieldRimShape(): THREE.Shape {
  const outer = createShieldShape(1.08);
  const inner = createShieldShape(0.95);
  outer.holes.push(inner);
  return outer;
}

export const ThreeDSecurityCore: React.FC<ThreeDSecurityCoreProps> = ({
  posture,
  reducedMotion,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState<boolean>(() => checkWebGLSupport());
  const [contextLost, setContextLost] = useState(false);

  const postureRef = useRef(posture);
  postureRef.current = posture;

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglReady) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 280);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        preserveDrawingBuffer: isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglReady(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b16, 0.045);
    const envTex = applyStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(0, 0.25, 5.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI * 0.28;
    controls.maxPolarAngle = Math.PI * 0.72;

    // 3-Point Studio Lighting with warm/cool contrast
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8b7cff, 1.8);
    rimLight.position.set(-4.5, 2.5, -3.5);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(0x22d3ee, 2.4, 9);
    coreLight.position.set(0, 0.2, 1.4);
    scene.add(coreLight);

    // Master floating assembly
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Primary Sculpted Frosted Glass Shield
    const shieldGeo = new THREE.ExtrudeGeometry(createShieldShape(1), {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
      curveSegments: 24,
    });
    shieldGeo.center();

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.08,
      roughness: 0.12,
      transmission: isSoftwareGl ? 0 : 0.86,
      transparent: true,
      opacity: isSoftwareGl ? 0.58 : 0.92,
      ior: 1.52,
      thickness: 1.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color(0x0ea5e9),
      attenuationDistance: 1.8,
      depthWrite: false,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.renderOrder = 2;
    coreGroup.add(shieldMesh);

    // 2. Brushed Titanium Rim Frame
    const rimGeo = new THREE.ExtrudeGeometry(createShieldRimShape(), {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 24,
    });
    rimGeo.center();
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.22,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    coreGroup.add(rimMesh);

    // 3. Inner Crystalline Energy Core & Wireframe Lattice
    const innerCoreGeo = new THREE.OctahedronGeometry(0.46, 0);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.15,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    innerCore.position.z = 0.02;
    coreGroup.add(innerCore);

    const latticeGeo = new THREE.IcosahedronGeometry(0.68, 1);
    const latticeMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.34,
    });
    const latticeMesh = new THREE.Mesh(latticeGeo, latticeMat);
    coreGroup.add(latticeMesh);

    // 4. Three Tilted Holographic Orbital Rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.018, 12, 72),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.65,
        metalness: 0.8,
        roughness: 0.2,
      }),
    );
    ring1.rotation.set(Math.PI * 0.38, Math.PI * 0.14, 0);
    coreGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.08, 0.014, 12, 72),
      new THREE.MeshStandardMaterial({
        color: 0x8b7cff,
        emissive: 0x8b7cff,
        emissiveIntensity: 0.5,
        metalness: 0.75,
        roughness: 0.25,
      }),
    );
    ring2.rotation.set(-Math.PI * 0.32, Math.PI * 0.22, 0.3);
    coreGroup.add(ring2);

    const ring3 = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.01, 10, 72),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.45,
      }),
    );
    ring3.rotation.set(Math.PI * 0.48, -Math.PI * 0.15, 0.2);
    coreGroup.add(ring3);

    // 5. Interconnected Orbital Data Nodes + Network Lines
    const nodeCount = 8;
    const nodeGeo = new THREE.IcosahedronGeometry(0.065, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.9,
      metalness: 0.5,
      roughness: 0.2,
    });
    const nodeInstanced = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    nodeInstanced.frustumCulled = false;
    coreGroup.add(nodeInstanced);

    const linePositions = new Float32Array(nodeCount * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
    });
    const networkLines = new THREE.LineSegments(lineGeo, lineMat);
    coreGroup.add(networkLines);

    // 6. Ambient Geometric Particles
    const particleCount = 72;
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.6 + Math.random() * 2.4;
      pPositions[i * 3] = Math.cos(angle) * radius;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      pPositions[i * 3 + 2] = Math.sin(angle) * radius - 0.6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Ground Halo Plane
    const haloGeo = new THREE.RingGeometry(0.7, 2.2, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -1.75;
    scene.add(halo);

    // Pointer parallax state
    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointerTarget.x = THREE.MathUtils.clamp(nx * 0.16, -0.18, 0.18);
      pointerTarget.y = THREE.MathUtils.clamp(ny * 0.12, -0.14, 0.14);
    };
    const onPointerLeave = () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    const _mat4 = new THREE.Matrix4();
    const _pos = new THREE.Vector3();
    const _quat = new THREE.Quaternion();
    const _scale = new THREE.Vector3(1, 1, 1);

    const updateDynamicElements = (elapsed: number, dt: number) => {
      const p = postureRef.current;
      const accentHex = p === 'Elevated' ? 0xf59e0b : p === 'Guarded' ? 0x60a5fa : 0x22c55e;
      innerCoreMat.emissive.setHex(p === 'Elevated' ? 0x22d3ee : accentHex);
      coreLight.color.setHex(p === 'Elevated' ? 0x22d3ee : accentHex);

      pointerSmooth.x = THREE.MathUtils.damp(pointerSmooth.x, pointerTarget.x, 5, dt);
      pointerSmooth.y = THREE.MathUtils.damp(pointerSmooth.y, pointerTarget.y, 5, dt);

      coreGroup.rotation.y = pointerSmooth.x + Math.sin(elapsed * 0.35) * 0.12;
      coreGroup.rotation.x = pointerSmooth.y * 0.7;
      coreGroup.position.y = Math.sin(elapsed * 0.9) * 0.08;

      innerCore.rotation.y = elapsed * 0.65;
      innerCore.rotation.x = elapsed * 0.35;
      latticeMesh.rotation.y = -elapsed * 0.25;

      ring1.rotation.z = elapsed * 0.22;
      ring2.rotation.z = -elapsed * 0.18;
      ring3.rotation.z = elapsed * 0.12;
      particles.rotation.y = elapsed * 0.05;

      const lineAttr = lineGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2 + elapsed * 0.28;
        const r = i % 2 === 0 ? 1.75 : 2.08;
        const yOff = Math.sin(elapsed * 0.7 + i * 1.1) * 0.55;
        _pos.set(Math.cos(angle) * r, yOff, Math.sin(angle) * r * 0.55);
        _mat4.compose(_pos, _quat, _scale);
        nodeInstanced.setMatrixAt(i, _mat4);

        lineAttr.setXYZ(i * 2, 0, 0, 0);
        lineAttr.setXYZ(i * 2 + 1, _pos.x, _pos.y, _pos.z);
      }
      nodeInstanced.instanceMatrix.needsUpdate = true;
      lineAttr.needsUpdate = true;
    };

    // Initial placement & immediate first frame
    updateDynamicElements(0.4, 0.016);
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    controls.update();
    renderer.render(scene, camera);

    let frameId = 0;
    let timerId = 0;
    let disposed = false;
    const startMs = performance.now();
    let lastMs = startMs;

    const registerTimer = (id: number) => {
      timerId = id;
    };

    const renderFrame = () => {
      if (disposed) return;
      const nowMs = performance.now();
      const dt = Math.min((nowMs - lastMs) / 1000, 0.05);
      const elapsed = (nowMs - startMs) / 1000 + 0.4;
      lastMs = nowMs;

      if (!reducedMotionRef.current) {
        updateDynamicElements(elapsed, dt);
      }
      controls.update();
      renderer.render(scene, camera);

      if (reducedMotionRef.current) {
        return; // Render once when reduced motion is preferred
      }

      if (isSoftwareGl) {
        afterDraw(renderer, renderFrame, registerTimer);
      } else {
        frameId = requestAnimationFrame(renderFrame);
      }
    };

    const onControlChange = () => {
      if (reducedMotionRef.current) {
        renderer.render(scene, camera);
      }
    };
    controls.addEventListener('change', onControlChange);

    if (!reducedMotionRef.current) {
      if (isSoftwareGl) {
        afterDraw(renderer, renderFrame, registerTimer);
      } else {
        frameId = requestAnimationFrame(renderFrame);
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (disposed) return;
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(entry.contentRect.width, 200);
      const h = Math.max(entry.contentRect.height, 200);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      resizeObserver.disconnect();
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      envTex.dispose();
      disposeSceneResources(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, reducedMotion]);

  if (!webglReady || contextLost) {
    return (
      <div
        data-testid="security-core-fallback"
        className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-sky-300/15 bg-[#091224]/80 p-6 ${className}`}
      >
        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_48px_rgba(34,211,238,0.2)]">
          <Shield className="h-16 w-16 text-cyan-300" />
        </div>
        <p className="mt-4 text-xs font-medium text-slate-300">
          3D Shield Core · {posture} Posture (2D Fallback Active)
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      data-testid="security-core-3d"
      data-posture={posture}
    >
      <div ref={mountRef} className="h-full w-full" aria-label="Interactive 3D Security Core Shield" />
      <div className="ks-hud-over-webgl pointer-events-none absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-300">
        Drag to orbit · Interactive Glass Core
      </div>
    </div>
  );
};
