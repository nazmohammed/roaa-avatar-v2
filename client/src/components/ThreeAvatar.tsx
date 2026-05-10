import { useRef, useEffect, useState, useMemo, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/* ── Props ──────────────────────────────────────────────────────── */
interface AvatarProps {
  visemeRef: MutableRefObject<number>;
  isSpeaking: boolean;
  size?: number;
}

/* ── Viseme openness & width tables (Azure viseme 0-21) ─────────── */
const V_OPEN: number[] = [
  0, 0.5, 0.85, 0.6, 0.4, 0.3, 0.35, 0.45, 0.5, 0.3, 0.25, 0.25,
  0.05, 0.3, 0.15, 0.12, 0.25, 0.15, 0.1, 0.3, 0.35, 0,
];
const V_WIDTH: number[] = [
  1, 1.1, 1.15, 0.8, 1.05, 0.9, 1.1, 0.7, 0.75, 0.9, 1, 1,
  0.85, 0.85, 0.95, 1.1, 0.8, 0.95, 0.8, 1, 0.85, 0.6,
];

/* ── Reusable materials (created once) ──────────────────────────── */
const SKIN     = new THREE.MeshStandardMaterial({ color: "#d4a07a", roughness: 0.6, metalness: 0.05 });
const HAIR     = new THREE.MeshStandardMaterial({ color: "#2c1810", roughness: 0.8 });
const UNIFORM  = new THREE.MeshStandardMaterial({ color: "#4c1d95", roughness: 0.5, metalness: 0.1 });
const GOLD     = new THREE.MeshStandardMaterial({ color: "#d4a843", roughness: 0.3, metalness: 0.6 });
const WHITE    = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5 });
const EYE_IRIS = new THREE.MeshStandardMaterial({ color: "#3d2b1f", roughness: 0.4 });
const PUPIL    = new THREE.MeshStandardMaterial({ color: "#0a0a0a" });
const LIPS     = new THREE.MeshStandardMaterial({ color: "#c2706a", roughness: 0.5 });
const MOUTH_IN = new THREE.MeshStandardMaterial({ color: "#1a0808", roughness: 0.9 });
const TEETH    = new THREE.MeshStandardMaterial({ color: "#f0e8e0", roughness: 0.4 });
const SCARF_M  = new THREE.MeshStandardMaterial({ color: "#d4a843", roughness: 0.4, metalness: 0.2 });
const HAT_M    = new THREE.MeshStandardMaterial({ color: "#4c1d95", roughness: 0.4 });
const HAT_BAND = new THREE.MeshStandardMaterial({ color: "#d4a843", roughness: 0.3, metalness: 0.5 });
const BADGE_M  = new THREE.MeshStandardMaterial({ color: "#d4a843", roughness: 0.2, metalness: 0.8 });
const EPAULET  = new THREE.MeshStandardMaterial({ color: "#d4a843", roughness: 0.3, metalness: 0.5 });

/* ── Character mesh ─────────────────────────────────────────────── */
function CabinCrewCharacter({ visemeRef, isSpeaking }: { visemeRef: MutableRefObject<number>; isSpeaking: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const jawRef = useRef<THREE.Group>(null!);
  const mouthOpenRef = useRef<THREE.Mesh>(null!);
  const teethTopRef = useRef<THREE.Mesh>(null!);
  const teethBotRef = useRef<THREE.Mesh>(null!);
  const upperLipRef = useRef<THREE.Mesh>(null!);
  const lowerLipRef = useRef<THREE.Mesh>(null!);
  const leftEyelidRef = useRef<THREE.Mesh>(null!);
  const rightEyelidRef = useRef<THREE.Mesh>(null!);

  const [blinkPhase, setBlinkPhase] = useState(0);
  const blinkTimer = useRef(3);

  // Smoothed values for animation
  const smoothOpen = useRef(0);
  const smoothWidth = useRef(1);

  useFrame((_state, delta) => {
    const t = _state.clock.elapsedTime;

    // Read viseme
    const vid = visemeRef.current;
    const targetOpen = V_OPEN[vid] ?? 0;
    const targetWidth = V_WIDTH[vid] ?? 1;

    // Smooth interpolation
    smoothOpen.current = THREE.MathUtils.damp(smoothOpen.current, targetOpen, 18, delta);
    smoothWidth.current = THREE.MathUtils.damp(smoothWidth.current, targetWidth, 18, delta);

    const open = smoothOpen.current;
    const width = smoothWidth.current;

    // Jaw rotation (opens downward)
    if (jawRef.current) {
      jawRef.current.rotation.x = open * 0.15;
    }

    // Mouth interior — scale with openness
    if (mouthOpenRef.current) {
      mouthOpenRef.current.scale.set(width * 0.8, Math.max(open, 0.01), 1);
      mouthOpenRef.current.visible = open > 0.03;
    }

    // Upper lip — slight stretch
    if (upperLipRef.current) {
      upperLipRef.current.scale.x = width;
      upperLipRef.current.position.y = open * 0.01;
    }

    // Lower lip — moves down with jaw
    if (lowerLipRef.current) {
      lowerLipRef.current.scale.x = width * 0.95;
      lowerLipRef.current.position.y = -0.04 - open * 0.06;
    }

    // Teeth visibility
    if (teethTopRef.current) {
      teethTopRef.current.visible = open > 0.15;
      teethTopRef.current.scale.x = width * 0.6;
    }
    if (teethBotRef.current) {
      teethBotRef.current.visible = open > 0.3;
      teethBotRef.current.position.y = -0.04 - open * 0.05;
      teethBotRef.current.scale.x = width * 0.5;
    }

    // Eye blink
    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0) {
      setBlinkPhase(1);
      setTimeout(() => setBlinkPhase(0), 120);
      blinkTimer.current = 2.5 + Math.random() * 4;
    }
    const lidScale = blinkPhase === 1 ? 1 : 0.01;
    if (leftEyelidRef.current) leftEyelidRef.current.scale.y = THREE.MathUtils.damp(leftEyelidRef.current.scale.y, lidScale, 25, delta);
    if (rightEyelidRef.current) rightEyelidRef.current.scale.y = THREE.MathUtils.damp(rightEyelidRef.current.scale.y, lidScale, 25, delta);

    // Idle sway / breathing
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.04;
      groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.01;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.005;

      // Subtle head nod when speaking
      if (isSpeaking) {
        groupRef.current.rotation.x = Math.sin(t * 2.5) * 0.02;
      } else {
        groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 5, delta);
      }
    }
  });

  // Geometry (memoized)
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.32, 32, 32), []);
  const eyeWhiteGeo = useMemo(() => new THREE.SphereGeometry(0.045, 16, 16), []);
  const irisGeo = useMemo(() => new THREE.SphereGeometry(0.025, 16, 16), []);
  const pupilGeo = useMemo(() => new THREE.SphereGeometry(0.013, 12, 12), []);
  const eyelidGeo = useMemo(() => new THREE.SphereGeometry(0.048, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const noseGeo = useMemo(() => new THREE.SphereGeometry(0.04, 12, 12), []);
  const lipGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.08, 0);
    shape.quadraticCurveTo(-0.04, 0.015, 0, 0.02);
    shape.quadraticCurveTo(0.04, 0.015, 0.08, 0);
    shape.quadraticCurveTo(0.04, -0.005, 0, -0.005);
    shape.quadraticCurveTo(-0.04, -0.005, -0.08, 0);
    return new THREE.ShapeGeometry(shape);
  }, []);
  const lowerLipGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.07, 0);
    shape.quadraticCurveTo(-0.035, -0.018, 0, -0.02);
    shape.quadraticCurveTo(0.035, -0.018, 0.07, 0);
    shape.quadraticCurveTo(0.035, 0.005, 0, 0.005);
    shape.quadraticCurveTo(-0.035, 0.005, -0.07, 0);
    return new THREE.ShapeGeometry(shape);
  }, []);
  const mouthInteriorGeo = useMemo(() => new THREE.PlaneGeometry(0.14, 0.08), []);
  const teethGeo = useMemo(() => new THREE.BoxGeometry(0.1, 0.015, 0.02), []);
  const bodyGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.18, 0.6, 16), []);
  const neckGeo = useMemo(() => new THREE.CylinderGeometry(0.1, 0.12, 0.12, 12), []);
  const shoulderGeo = useMemo(() => new THREE.SphereGeometry(0.09, 12, 12), []);
  const armGeo = useMemo(() => new THREE.CylinderGeometry(0.05, 0.045, 0.35, 8), []);
  const hatGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.22, 0.1, 24), []);
  const hatTopGeo = useMemo(() => new THREE.CylinderGeometry(0.19, 0.2, 0.01, 24), []);
  const hatBandGeo = useMemo(() => new THREE.CylinderGeometry(0.221, 0.221, 0.02, 24), []);
  const scarfGeo = useMemo(() => new THREE.TorusGeometry(0.13, 0.025, 8, 24, Math.PI), []);
  const scarfTailGeo = useMemo(() => new THREE.BoxGeometry(0.05, 0.15, 0.015), []);
  const badgeGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.015);
    shape.lineTo(0.025, 0.005);
    shape.lineTo(0.015, -0.01);
    shape.lineTo(0, -0.005);
    shape.lineTo(-0.015, -0.01);
    shape.lineTo(-0.025, 0.005);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  const hairBackGeo = useMemo(() => new THREE.SphereGeometry(0.33, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6), []);
  const hairSideGeo = useMemo(() => new THREE.SphereGeometry(0.15, 16, 16, 0, Math.PI, 0, Math.PI * 0.8), []);
  const epauletGeo = useMemo(() => new THREE.BoxGeometry(0.06, 0.01, 0.04), []);
  const collarGeo = useMemo(() => new THREE.BoxGeometry(0.06, 0.05, 0.01), []);

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* ── Head ────────────────────────────────────── */}
      <mesh geometry={headGeo} material={SKIN} position={[0, 0.55, 0]} />

      {/* ── Hair ────────────────────────────────────── */}
      <mesh geometry={hairBackGeo} material={HAIR} position={[0, 0.62, -0.02]} rotation={[0.3, 0, 0]} />
      {/* Side hair */}
      <mesh geometry={hairSideGeo} material={HAIR} position={[-0.22, 0.45, 0.05]} rotation={[0, 0.3, 0.2]} />
      <mesh geometry={hairSideGeo} material={HAIR} position={[0.22, 0.45, 0.05]} rotation={[0, -0.3, -0.2]} />
      {/* Hair fringe */}
      <mesh material={HAIR} position={[0, 0.72, 0.18]}>
        <sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
      </mesh>

      {/* ── Hat (pillbox) ───────────────────────────── */}
      <mesh geometry={hatGeo} material={HAT_M} position={[0, 0.82, 0.02]} rotation={[-0.15, 0, 0]} />
      <mesh geometry={hatTopGeo} material={HAT_M} position={[0, 0.87, 0.02]} rotation={[-0.15, 0, 0]} />
      <mesh geometry={hatBandGeo} material={HAT_BAND} position={[0, 0.78, 0.02]} rotation={[-0.15, 0, 0]} />
      {/* Wing badge on hat */}
      <mesh geometry={badgeGeo} material={BADGE_M} position={[0, 0.82, 0.23]} />

      {/* ── Eyes ────────────────────────────────────── */}
      <group position={[-0.1, 0.58, 0.26]}>
        <mesh geometry={eyeWhiteGeo} material={WHITE} />
        <mesh geometry={irisGeo} material={EYE_IRIS} position={[0, 0, 0.025]} />
        <mesh geometry={pupilGeo} material={PUPIL} position={[0, 0, 0.04]} />
        <mesh ref={leftEyelidRef} geometry={eyelidGeo} material={SKIN} position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]} />
      </group>
      <group position={[0.1, 0.58, 0.26]}>
        <mesh geometry={eyeWhiteGeo} material={WHITE} />
        <mesh geometry={irisGeo} material={EYE_IRIS} position={[0, 0, 0.025]} />
        <mesh geometry={pupilGeo} material={PUPIL} position={[0, 0, 0.04]} />
        <mesh ref={rightEyelidRef} geometry={eyelidGeo} material={SKIN} position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]} />
      </group>

      {/* Eyebrows */}
      <mesh material={HAIR} position={[-0.1, 0.64, 0.28]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.08, 0.012, 0.01]} />
      </mesh>
      <mesh material={HAIR} position={[0.1, 0.64, 0.28]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.08, 0.012, 0.01]} />
      </mesh>

      {/* ── Nose ────────────────────────────────────── */}
      <mesh geometry={noseGeo} material={SKIN} position={[0, 0.52, 0.3]} scale={[0.7, 0.8, 1]} />

      {/* ── Mouth area (with jaw group) ─────────────── */}
      <group position={[0, 0.44, 0.28]}>
        {/* Upper lip (stays mostly fixed) */}
        <mesh ref={upperLipRef} geometry={lipGeo} material={LIPS} position={[0, 0.01, 0]} />

        {/* Jaw group — rotates open */}
        <group ref={jawRef}>
          {/* Lower lip */}
          <mesh ref={lowerLipRef} geometry={lowerLipGeo} material={LIPS} position={[0, -0.04, 0]} />

          {/* Mouth interior (dark) */}
          <mesh ref={mouthOpenRef} geometry={mouthInteriorGeo} material={MOUTH_IN} position={[0, -0.01, -0.01]} />

          {/* Top teeth */}
          <mesh ref={teethTopRef} geometry={teethGeo} material={TEETH} position={[0, 0.005, 0]} visible={false} />

          {/* Bottom teeth */}
          <mesh ref={teethBotRef} geometry={teethGeo} material={TEETH} position={[0, -0.04, 0]} visible={false} scale={[0.8, 1, 1]} />
        </group>
      </group>

      {/* ── Neck ────────────────────────────────────── */}
      <mesh geometry={neckGeo} material={SKIN} position={[0, 0.29, 0]} />

      {/* ── Scarf (gold) ────────────────────────────── */}
      <mesh geometry={scarfGeo} material={SCARF_M} position={[0, 0.26, 0.08]} rotation={[0.2, 0, 0]} />
      <mesh geometry={scarfTailGeo} material={SCARF_M} position={[0.05, 0.15, 0.12]} rotation={[0.15, 0, 0.1]} />

      {/* ── Body (torso in purple uniform) ──────────── */}
      <mesh geometry={bodyGeo} material={UNIFORM} position={[0, -0.05, 0]} />

      {/* Collar points */}
      <mesh geometry={collarGeo} material={WHITE} position={[-0.08, 0.22, 0.16]} rotation={[0.4, 0.3, 0]} />
      <mesh geometry={collarGeo} material={WHITE} position={[0.08, 0.22, 0.16]} rotation={[0.4, -0.3, 0]} />

      {/* Wing pin on chest */}
      <mesh geometry={badgeGeo} material={BADGE_M} position={[-0.08, 0.1, 0.19]} scale={[1.5, 1.5, 1]} />

      {/* ── Shoulders & Arms ────────────────────────── */}
      <mesh geometry={shoulderGeo} material={UNIFORM} position={[-0.25, 0.18, 0]} />
      <mesh geometry={shoulderGeo} material={UNIFORM} position={[0.25, 0.18, 0]} />
      <mesh geometry={armGeo} material={UNIFORM} position={[-0.28, -0.02, 0]} rotation={[0, 0, 0.12]} />
      <mesh geometry={armGeo} material={UNIFORM} position={[0.28, -0.02, 0]} rotation={[0, 0, -0.12]} />

      {/* Epaulettes */}
      <mesh geometry={epauletGeo} material={EPAULET} position={[-0.25, 0.22, 0]} />
      <mesh geometry={epauletGeo} material={EPAULET} position={[0.25, 0.22, 0]} />

      {/* Hands (skin) */}
      <mesh material={SKIN} position={[-0.3, -0.18, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>
      <mesh material={SKIN} position={[0.3, -0.18, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>
    </group>
  );
}

/* ── Main exported component with Canvas ───────────────────────── */
export default function ThreeAvatar({ visemeRef, isSpeaking, size = 400 }: AvatarProps) {
  return (
    <div style={{ width: size, height: size * 1.2, borderRadius: 20, overflow: "hidden" }}>
      <Canvas
        camera={{ position: [0, 0.45, 1.1], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "linear-gradient(180deg, #1a1030 0%, #0f0b1a 100%)" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1.2} color="#fff5ee" />
        <directionalLight position={[-2, 1, 3]} intensity={0.4} color="#b8a0d4" />
        <pointLight position={[0, 0.5, 2]} intensity={0.3} color="#d4a843" />

        <CabinCrewCharacter visemeRef={visemeRef} isSpeaking={isSpeaking} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 8}
          maxAzimuthAngle={Math.PI / 8}
        />
      </Canvas>
    </div>
  );
}
