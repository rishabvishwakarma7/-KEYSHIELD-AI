import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ProcessNode, ProcessRiskLevel } from '../types/security';
import { buildProcessTree, type ProcessTreeNode } from '../services/securityAdapter';
import {
  afterDraw,
  applyStudioEnvironment,
  checkWebGLSupport,
  detectSoftwareGl,
  disposeSceneResources,
} from './webglUtils';

interface ProcessNetwork3DProps {
  processes: ProcessNode[];
  selectedPid: number | null;
  onSelectProcess: (pid: number) => void;
  reducedMotion: boolean;
  className?: string;
}

const RISK_HEX: Record<ProcessRiskLevel, number> = {
  Normal: 0x60a5fa,
  Informational: 0x22d3ee,
  Suspicious: 0xf59e0b,
  'High Risk': 0xef4444,
};

interface LayoutNode {
  process: ProcessNode;
  position: THREE.Vector3;
  parentPosition: THREE.Vector3 | null;
}

function computeTreePositions(roots: ProcessTreeNode[]): LayoutNode[] {
  const result: LayoutNode[] = [];
  let leafCursor = 0;

  const traverse = (
    node: ProcessTreeNode,
    parentPos: THREE.Vector3 | null,
  ): THREE.Vector3 => {
    const y = 2.2 - node.depth * 1.18;
    let x = 0;
    let z = 0;

    if (node.children.length === 0) {
      x = (leafCursor - 2.5) * 1.35;
      z = ((leafCursor % 2) - 0.5) * 0.9;
      leafCursor += 1;
    } else {
      const childPositions: THREE.Vector3[] = [];
      const currentPosPlaceholder = new THREE.Vector3(0, y, 0);
      for (const child of node.children) {
        childPositions.push(traverse(child, currentPosPlaceholder));
      }
      x = childPositions.reduce((sum, p) => sum + p.x, 0) / childPositions.length;
      z = childPositions.reduce((sum, p) => sum + p.z, 0) / childPositions.length * 0.7;
    }

    const pos = new THREE.Vector3(x, y, z);
    result.push({
      process: node.process,
      position: pos,
      parentPosition: parentPos,
    });
    return pos;
  };

  for (const r of roots) {
    traverse(r, null);
  }

  // Fix parent references cleanly by PID lookup
  const byPid = new Map<number, THREE.Vector3>();
  for (const item of result) {
    byPid.set(item.process.pid, item.position);
  }
  for (const item of result) {
    item.parentPosition =
      item.process.ppid !== null && byPid.has(item.process.ppid)
        ? byPid.get(item.process.ppid)!
        : null;
  }

  return result;
}

export const ProcessNetwork3D: React.FC<ProcessNetwork3DProps> = ({
  processes,
  selectedPid,
  onSelectProcess,
  reducedMotion,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState(() => checkWebGLSupport());
  const [hoveredInfo, setHoveredInfo] = useState<{
    process: ProcessNode;
    x: number;
    y: number;
  } | null>(null);

  const onSelectRef = useRef(onSelectProcess);
  onSelectRef.current = onSelectProcess;

  const selectedPidRef = useRef(selectedPid);
  selectedPidRef.current = selectedPid;

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const layoutNodes = useMemo(() => {
    const tree = buildProcessTree(processes);
    return computeTreePositions(tree);
  }, [processes]);

  const layoutRef = useRef(layoutNodes);
  layoutRef.current = layoutNodes;

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglReady) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 360);

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
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b16, 0.035);
    const envTex = applyStudioEnvironment(renderer, scene);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 80);
    camera.position.set(0.5, 0.8, 7.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.95));
    const key = new THREE.DirectionalLight(0xe0f2fe, 2.0);
    key.position.set(5, 7, 6);
    scene.add(key);

    // Subtle reference grid floor
    const grid = new THREE.GridHelper(12, 16, 0x1e3a5f, 0x0f2038);
    grid.position.y = -3.1;
    scene.add(grid);

    const interactables: THREE.Mesh[] = [];
    const nodeGroups = new Map<number, { ring: THREE.Mesh; core: THREE.Mesh; baseHex: number }>();

    const sphereGeo = new THREE.IcosahedronGeometry(0.26, 2);
    const ringGeo = new THREE.TorusGeometry(0.38, 0.022, 10, 36);

    for (const item of layoutRef.current) {
      const baseHex = RISK_HEX[item.process.riskLevel];
      const group = new THREE.Group();
      group.position.copy(item.position);

      const coreMat = new THREE.MeshPhysicalMaterial({
        color: baseHex,
        emissive: baseHex,
        emissiveIntensity: item.process.riskLevel === 'High Risk' ? 0.55 : 0.25,
        roughness: 0.18,
        metalness: 0.35,
        clearcoat: 0.8,
      });
      const coreMesh = new THREE.Mesh(sphereGeo, coreMat);
      coreMesh.userData.process = item.process;
      group.add(coreMesh);
      interactables.push(coreMesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color: baseHex,
        transparent: true,
        opacity: 0.65,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      group.add(ringMesh);

      scene.add(group);
      nodeGroups.set(item.process.pid, { ring: ringMesh, core: coreMesh, baseHex });

      if (item.parentPosition) {
        const curve = new THREE.LineCurve3(item.parentPosition, item.position);
        const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.018, 6, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: item.process.riskLevel === 'Normal' ? 0x3b82f6 : baseHex,
          transparent: true,
          opacity: 0.48,
        });
        scene.add(new THREE.Mesh(tubeGeo, tubeMat));
      }
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let lastHoverTime = 0;

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverTime < 45) return;
      lastHoverTime = now;
      const rect = updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const proc = hits[0].object.userData.process as ProcessNode;
        renderer.domElement.style.cursor = 'pointer';
        setHoveredInfo({
          process: proc,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredInfo(null);
      }
    };

    const onClick = (e: PointerEvent) => {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const proc = hits[0].object.userData.process as ProcessNode;
        onSelectRef.current(proc.pid);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let timerId = 0;
    let disposed = false;
    const startMs = performance.now();

    const drawFrame = () => {
      const elapsed = (performance.now() - startMs) / 1000;

      nodeGroups.forEach((entry, pid) => {
        const isSelected = selectedPidRef.current === pid;
        const targetScale = isSelected ? 1.38 : 1.0;
        entry.core.scale.setScalar(targetScale);
        entry.ring.scale.setScalar(isSelected ? 1.5 : 1.0);
        if (!reducedMotionRef.current) {
          entry.ring.rotation.z = elapsed * 0.6;
        }
        const mat = entry.core.material as THREE.MeshPhysicalMaterial;
        mat.emissiveIntensity = isSelected ? 1.0 : entry.baseHex === 0xef4444 ? 0.55 : 0.25;
      });

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
      if (reducedMotionRef.current) {
        renderer.render(scene, camera);
      }
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
      const w = Math.max(rect.width, 240);
      const h = Math.max(rect.height, 240);
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
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      envTex.dispose();
      disposeSceneResources(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglReady, layoutNodes, reducedMotion]);

  if (!webglReady) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-slate-700/50 bg-[#0B1324] p-6 text-sm text-slate-300 ${className}`}>
        WebGL is unavailable in this browser context. Please switch to the 2D Process Tree view above.
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-sky-300/15 bg-[#060A15] ${className}`} data-testid="process-network-3d">
      <div ref={mountRef} className="h-full w-full" aria-label="Interactive 3D Process Relationship Graph" />
      <div className="ks-hud-over-webgl pointer-events-none absolute top-3 left-3 flex flex-wrap items-center gap-3 rounded-xl px-3 py-1.5 text-[11px] text-slate-200">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#60A5FA]" /> Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#22D3EE]" /> Informational
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" /> Suspicious
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" /> High Risk
        </span>
      </div>
      <div className="ks-hud-over-webgl pointer-events-none absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-[11px] text-slate-300">
        Click any 3D node to inspect process lineage · Drag to orbit · Scroll to zoom
      </div>
      {hoveredInfo && (
        <div
          className="ks-hud-over-webgl pointer-events-none absolute z-20 rounded-xl px-3 py-2 text-xs text-slate-100"
          style={{
            left: Math.min(hoveredInfo.x + 14, 340),
            top: Math.max(hoveredInfo.y - 12, 12),
          }}
        >
          <div className="font-semibold text-cyan-200">{hoveredInfo.process.name}</div>
          <div className="font-mono text-[11px] text-slate-400 tabular-nums">
            PID {hoveredInfo.process.pid} · {hoveredInfo.process.riskLevel}
          </div>
        </div>
      )}
    </div>
  );
};
