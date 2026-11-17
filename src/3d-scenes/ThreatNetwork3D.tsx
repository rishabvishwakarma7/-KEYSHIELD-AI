import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  afterDraw,
  applyStudioEnvironment,
  checkWebGLSupport,
  detectSoftwareGl,
  disposeSceneResources,
} from './webglUtils';

export interface ThreatEntitySelection {
  label: string;
  kind: 'Endpoint' | 'Process' | 'Network Destination' | 'Security Event';
  detail: string;
  eventId?: string;
  pid?: number;
}

interface ThreatNetwork3DProps {
  endpointId: string;
  reducedMotion: boolean;
  onSelectEntity?: (entity: ThreatEntitySelection) => void;
  className?: string;
}

interface NetworkNodeDef {
  id: string;
  label: string;
  kind: ThreatEntitySelection['kind'];
  detail: string;
  pos: [number, number, number];
  color: number;
  eventId?: string;
  pid?: number;
}

export const ThreatNetwork3D: React.FC<ThreatNetwork3DProps> = ({
  endpointId,
  reducedMotion,
  onSelectEntity,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState(() => checkWebGLSupport());
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const onSelectRef = useRef(onSelectEntity);
  onSelectRef.current = onSelectEntity;

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglReady) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 260);

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
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b16, 0.04);
    const envTex = applyStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 60);
    camera.position.set(0, 1.35, 6.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.5;
    controls.maxDistance = 11;

    scene.add(new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.95));
    const key = new THREE.DirectionalLight(0xe0f2fe, 2.0);
    key.position.set(4, 5, 4);
    scene.add(key);

    const nodes: NetworkNodeDef[] = [
      {
        id: 'ep',
        label: endpointId,
        kind: 'Endpoint',
        detail: 'Managed demonstration host emitting Sysmon & ETW-Kernel telemetry.',
        pos: [0, 0.1, 0],
        color: 0x22d3ee,
      },
      {
        id: 'p1',
        label: 'AudioSrvHelper.exe (6812)',
        kind: 'Process',
        detail: 'Unsigned user-mode binary with SetWindowsHookExW import metadata.',
        pos: [-1.7, 0.75, 0.6],
        color: 0xef4444,
        pid: 6812,
      },
      {
        id: 'p2',
        label: 'powershell.exe (4920)',
        kind: 'Process',
        detail: 'Spawned by winword.exe with ExecutionPolicy Bypass.',
        pos: [-1.5, -0.75, -0.4],
        color: 0xf59e0b,
        pid: 4920,
      },
      {
        id: 'n1',
        label: '198.51.100.74:8443',
        kind: 'Network Destination',
        detail: 'Uncategorized TLS destination with 60s cadence; requires corroboration before attribution.',
        pos: [1.85, 0.85, 0.45],
        color: 0xf59e0b,
        eventId: 'EVT-90416',
      },
      {
        id: 'n2',
        label: '13.107.42.14:443',
        kind: 'Network Destination',
        detail: 'Expected developer IDE HTTPS telemetry endpoint.',
        pos: [1.65, -0.85, -0.5],
        color: 0x60a5fa,
        eventId: 'EVT-90412',
      },
      {
        id: 'e1',
        label: 'EVT-90418 (DLL Hook Meta)',
        kind: 'Security Event',
        detail: 'Sysmon EID 7 unsigned DLL load observed.',
        pos: [-0.2, 1.45, -0.8],
        color: 0x8b7cff,
        eventId: 'EVT-90418',
      },
    ];

    const edges: [string, string, number][] = [
      ['ep', 'p1', 0xef4444],
      ['ep', 'p2', 0xf59e0b],
      ['p1', 'n1', 0xf59e0b],
      ['ep', 'n2', 0x60a5fa],
      ['p1', 'e1', 0x8b7cff],
      ['p2', 'p1', 0xf59e0b],
    ];

    const posMap = new Map<string, THREE.Vector3>();
    const interactables: THREE.Mesh[] = [];
    const nodeGeo = new THREE.OctahedronGeometry(0.24, 1);

    for (const n of nodes) {
      const v = new THREE.Vector3(...n.pos);
      posMap.set(n.id, v);
      const mat = new THREE.MeshPhysicalMaterial({
        color: n.color,
        emissive: n.color,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.4,
        clearcoat: 0.9,
      });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.copy(v);
      mesh.userData.entity = n;
      scene.add(mesh);
      interactables.push(mesh);
    }

    const curves: { curve: THREE.CatmullRomCurve3; pulse: THREE.Mesh; speed: number; offset: number }[] = [];
    const pulseGeo = new THREE.SphereGeometry(0.055, 8, 8);

    for (let i = 0; i < edges.length; i++) {
      const [fromId, toId, color] = edges[i];
      const a = posMap.get(fromId)!;
      const b = posMap.get(toId)!;
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.22, 0.15));
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const tubeGeo = new THREE.TubeGeometry(curve, 18, 0.014, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.42,
      });
      scene.add(new THREE.Mesh(tubeGeo, tubeMat));

      const pulseMat = new THREE.MeshBasicMaterial({ color });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pulse);
      curves.push({ curve, pulse, speed: 0.28 + (i % 3) * 0.08, offset: i * 0.17 });
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onClick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const entity = hits[0].object.userData.entity as NetworkNodeDef;
        setSelectedLabel(`${entity.kind}: ${entity.label}`);
        onSelectRef.current?.({
          label: entity.label,
          kind: entity.kind,
          detail: entity.detail,
          eventId: entity.eventId,
          pid: entity.pid,
        });
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let timerId = 0;
    let disposed = false;
    const startMs = performance.now();
    const _pt = new THREE.Vector3();

    const drawFrame = () => {
      const elapsed = (performance.now() - startMs) / 1000;
      for (const item of curves) {
        const t = (elapsed * item.speed + item.offset) % 1;
        item.curve.getPointAt(t, _pt);
        item.pulse.position.copy(_pt);
      }
      controls.update();
      renderer.render(scene, camera);
    };

    drawFrame();

    const tick = () => {
      if (disposed) return;
      drawFrame();
      if (reducedMotionRef.current) return;
      if (isSoftwareGl) {
        afterDraw(renderer, tick, (id) => {
          timerId = id;
        });
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    const onControlsChange = () => {
      if (reducedMotionRef.current) renderer.render(scene, camera);
    };
    controls.addEventListener('change', onControlsChange);
    if (!reducedMotionRef.current) {
      if (isSoftwareGl) {
        afterDraw(renderer, tick, (id) => {
          timerId = id;
        });
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (disposed) return;
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const w = Math.max(rect.width, 220);
      const h = Math.max(rect.height, 220);
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
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      renderer.domElement.removeEventListener('click', onClick);
      envTex.dispose();
      disposeSceneResources(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, endpointId, reducedMotion]);

  if (!webglReady) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border border-sky-300/15 bg-[#091224]/80 p-6 text-center ${className}`}>
        <p className="text-sm font-medium text-slate-200">Threat Network Graph (2D Summary)</p>
        <p className="mt-1 text-xs text-slate-400">
          {endpointId} · AudioSrvHelper.exe (6812) → 198.51.100.74:8443 (Anomalous cadence, corroboration pending)
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-sky-300/15 bg-[#060A15] ${className}`} data-testid="threat-network-3d">
      <div ref={mountRef} className="h-full w-full" aria-label="Interactive 3D Threat Network Visualization" />
      <div className="ks-hud-over-webgl pointer-events-none absolute top-3 left-3 rounded-lg px-2.5 py-1 text-[11px] text-slate-200">
        {selectedLabel ? selectedLabel : 'Click any 3D node to inspect endpoint, process, or destination'}
      </div>
      <div className="ks-hud-over-webgl pointer-events-none absolute bottom-3 right-3 rounded-lg px-2.5 py-1 text-[11px] text-slate-400">
        Note: Flagged destinations indicate cadence anomalies, not confirmed malice
      </div>
    </div>
  );
};
