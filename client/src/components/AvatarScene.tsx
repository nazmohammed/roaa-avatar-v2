/**
 * 3D Avatar Scene — Ready Player Me model with Azure Speech viseme lip-sync.
 *
 * Renders a GLB avatar in a React Three Fiber canvas.
 * Drives mouth morph targets from Azure TTS viseme events.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

// ── Azure Speech visemeId → Ready Player Me Oculus blend shape name ──
// visemeId 0 = silence (all morph targets to 0)
const VISEME_MAP: Record<number, string> = {
  0: "",              // silence
  1: "viseme_PP",     // p, b, m
  2: "viseme_FF",     // f, v
  3: "viseme_TH",     // θ, ð
  4: "viseme_DD",     // t, d, n
  5: "viseme_kk",     // k, g
  6: "viseme_CH",     // tʃ, dʒ, ʃ
  7: "viseme_SS",     // s, z
  8: "viseme_nn",     // n, l
  9: "viseme_RR",     // r
  10: "viseme_aa",    // æ
  11: "viseme_E",     // ɛ
  12: "viseme_I",     // ɪ
  13: "viseme_O",     // ɔ
  14: "viseme_U",     // ʊ
  15: "viseme_aa",    // ɑ → aa
  16: "viseme_O",     // aʊ → O
  17: "viseme_U",     // ɔɪ → U
  18: "viseme_E",     // eɪ → E
  19: "viseme_I",     // oʊ → I
  20: "viseme_SS",    // ər → SS
  21: "viseme_CH",    // aɪ → CH
};

// All RPM Oculus viseme blend shape names
const ALL_VISEMES = [
  "viseme_PP", "viseme_FF", "viseme_TH", "viseme_DD", "viseme_kk",
  "viseme_CH", "viseme_SS", "viseme_nn", "viseme_RR", "viseme_aa",
  "viseme_E", "viseme_I", "viseme_O", "viseme_U",
];

interface AvatarModelProps {
  modelUrl: string;
  visemeRef: React.MutableRefObject<number>;
  isSpeaking: boolean;
}

function AvatarModel({ modelUrl, visemeRef, isSpeaking }: AvatarModelProps) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null!);
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const breatheT = useRef(0);

  // Find the mesh with viseme morph targets
  useEffect(() => {
    scene.traverse((child) => {
      if (
        child instanceof THREE.SkinnedMesh &&
        child.morphTargetDictionary &&
        child.morphTargetInfluences &&
        "viseme_aa" in child.morphTargetDictionary
      ) {
        headMeshRef.current = child;
      }
    });
  }, [scene]);

  // Per-frame animation: lip-sync + idle breathing
  useFrame(() => {
    const mesh = headMeshRef.current;
    if (mesh?.morphTargetDictionary && mesh.morphTargetInfluences) {
      const targetName = VISEME_MAP[visemeRef.current] || "";

      for (const name of ALL_VISEMES) {
        const idx = mesh.morphTargetDictionary[name];
        if (idx === undefined) continue;
        const goal = name === targetName ? 0.8 : 0;
        const cur = mesh.morphTargetInfluences[idx] || 0;
        // Smooth blend toward goal
        mesh.morphTargetInfluences[idx] = cur + (goal - cur) * 0.25;
      }

      // Decay when not speaking
      if (!isSpeaking && visemeRef.current === 0) {
        for (const name of ALL_VISEMES) {
          const idx = mesh.morphTargetDictionary[name];
          if (idx !== undefined && mesh.morphTargetInfluences[idx] > 0.01) {
            mesh.morphTargetInfluences[idx] *= 0.85;
          }
        }
      }
    }

    // Idle breathing
    breatheT.current += 0.012;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(breatheT.current) * 0.004 - 1.6;
      groupRef.current.rotation.z = Math.sin(breatheT.current * 0.5) * 0.002;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.6, 0]}>
      <primitive object={scene} scale={1.8} />
    </group>
  );
}

// ── Fallback while model loads ──────────────────────────────────

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color="#7c3aed" wireframe />
    </mesh>
  );
}

// ── Public component ────────────────────────────────────────────

interface AvatarSceneProps {
  modelUrl: string;
  isSpeaking: boolean;
  visemeRef: React.MutableRefObject<number>;
}

export default function AvatarScene({ modelUrl, isSpeaking, visemeRef }: AvatarSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 1.2], fov: 30 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1} />
      <directionalLight position={[-2, 1, -2]} intensity={0.3} />
      <Suspense fallback={<LoadingFallback />}>
        <AvatarModel
          modelUrl={modelUrl}
          visemeRef={visemeRef}
          isSpeaking={isSpeaking}
        />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

export function preloadAvatar(url: string) {
  useGLTF.preload(url);
}
