/**
 * Avatar3D — Riyadh Air cabin crew 3D avatar (Meshy.ai model).
 *
 * Uses a programmatic environment map so chrome/visor surfaces
 * get proper reflections without downloading external HDR files.
 * Materials are left untouched so the model looks exactly like
 * it does in Meshy.ai's viewer.
 */

import { Suspense, useRef, useMemo, useEffect, type MutableRefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Avatar3DProps {
  visemeRef: MutableRefObject<number>;
  isSpeaking: boolean;
  size?: number;
  fullscreen?: boolean;
}

const V_OPEN: number[] = [
  0, 0.5, 0.85, 0.6, 0.4, 0.3, 0.35, 0.45, 0.5, 0.3,
  0.25, 0.25, 0.05, 0.3, 0.15, 0.12, 0.25, 0.15, 0.1, 0.3, 0.35, 0,
];

/**
 * Creates a studio-style environment map from a simple gradient scene.
 * This gives metallic/glossy surfaces something to reflect without
 * needing to download external HDR files.
 */
function SceneEnv() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGen = new THREE.PMREMGenerator(gl);
    pmremGen.compileEquirectangularShader();

    // Build a small scene with colored panels to act as reflections
    const envScene = new THREE.Scene();

    // Bright white overhead — key reflection for visor and chrome
    const topGeo = new THREE.PlaneGeometry(10, 10);
    const topMat = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
    const topPlane = new THREE.Mesh(topGeo, topMat);
    topPlane.position.set(0, 5, 0);
    topPlane.rotation.x = Math.PI / 2;
    envScene.add(topPlane);

    // Light grey floor
    const floorMat = new THREE.MeshBasicMaterial({ color: "#666666", side: THREE.DoubleSide });
    const floorPlane = new THREE.Mesh(topGeo.clone(), floorMat);
    floorPlane.position.set(0, -5, 0);
    floorPlane.rotation.x = Math.PI / 2;
    envScene.add(floorPlane);

    // Side panels — light grey for subtle reflections
    const sideMat = new THREE.MeshBasicMaterial({ color: "#555555", side: THREE.DoubleSide });
    const sideGeo = new THREE.PlaneGeometry(10, 10);
    const leftPlane = new THREE.Mesh(sideGeo, sideMat);
    leftPlane.position.set(-5, 0, 0);
    leftPlane.rotation.y = Math.PI / 2;
    envScene.add(leftPlane);

    const rightPlane = new THREE.Mesh(sideGeo.clone(), sideMat.clone());
    rightPlane.position.set(5, 0, 0);
    rightPlane.rotation.y = -Math.PI / 2;
    envScene.add(rightPlane);

    // Front — bright panel to light up the face/visor
    const frontMat = new THREE.MeshBasicMaterial({ color: "#cccccc", side: THREE.DoubleSide });
    const frontPlane = new THREE.Mesh(sideGeo.clone(), frontMat);
    frontPlane.position.set(0, 0, 5);
    envScene.add(frontPlane);

    // Back — medium grey
    const backMat = new THREE.MeshBasicMaterial({ color: "#333333", side: THREE.DoubleSide });
    const backPlane = new THREE.Mesh(sideGeo.clone(), backMat);
    backPlane.position.set(0, 0, -5);
    envScene.add(backPlane);

    const envMap = pmremGen.fromScene(envScene, 0.04).texture;
    scene.environment = envMap;

    // Cleanup
    envScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });
    pmremGen.dispose();

    return () => {
      envMap.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);

  return null;
}

function AvatarModel({
  visemeRef,
  isSpeaking,
}: {
  visemeRef: MutableRefObject<number>;
  isSpeaking: boolean;
}) {
  const gltf = useLoader(GLTFLoader, "/avatar-skybot.glb");
  const groupRef = useRef<THREE.Group>(null!);
  const smoothOpenness = useRef(0);

  // Boost emissive glow so LED eyes/smile are visible on the dark visor
  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mat = child.material;
        if (mat instanceof THREE.MeshStandardMaterial) {
          // The emissive texture has the LED eyes/smile baked in.
          // Boost intensity so they glow visibly through the dark visor.
          if (mat.emissiveMap) {
            mat.emissiveIntensity = 3.0;
          }
          mat.needsUpdate = true;
        }
      }
    });
  }, [gltf.scene]);

  // Auto-center & scale
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1.3 / maxDim;
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x * s, -center.y * s + 0.02, -center.z * s),
    };
  }, [gltf.scene]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (!groupRef.current) return;

    const vid = visemeRef.current;
    const targetOpen = V_OPEN[vid] ?? 0;
    smoothOpenness.current += (targetOpen - smoothOpenness.current) * 0.15;
    const open = smoothOpenness.current;

    const breathe = Math.sin(t * 1.2) * 0.004;
    const weightShift = Math.sin(t * 0.25) * 0.012;
    const headTiltX = Math.sin(t * 0.4) * 0.008;
    const headTiltZ = Math.sin(t * 0.35) * 0.006;

    if (isSpeaking) {
      const nod = -open * 0.06 + Math.sin(t * 2.5) * 0.012;
      const sideMotion = Math.sin(t * 1.1) * 0.015 + Math.sin(t * 0.6) * 0.008;
      const lean = Math.sin(t * 0.8) * 0.006;
      const bodySway = Math.sin(t * 1.6) * 0.003;

      groupRef.current.position.y = offset.y + breathe + bodySway;
      groupRef.current.position.x = offset.x;
      groupRef.current.rotation.x = nod + headTiltX;
      groupRef.current.rotation.y = sideMotion + weightShift;
      groupRef.current.rotation.z = lean + headTiltZ;
    } else {
      const occasionalShift = Math.sin(t * 0.12) * 0.005;
      groupRef.current.position.y = offset.y + breathe;
      groupRef.current.position.x = offset.x + occasionalShift;
      groupRef.current.rotation.x = headTiltX;
      groupRef.current.rotation.y = weightShift;
      groupRef.current.rotation.z = headTiltZ;
    }
  });

  return (
    <group ref={groupRef} position={offset} scale={[scale, scale, scale]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function LoadingIndicator() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.z = clock.elapsedTime * 2;
  });
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.15, 0.02, 8, 32, Math.PI * 1.5]} />
      <meshBasicMaterial color="#d4a843" />
    </mesh>
  );
}

export default function Avatar3D({
  visemeRef,
  isSpeaking,
  size = 380,
  fullscreen = false,
}: Avatar3DProps) {
  const containerStyle: React.CSSProperties = fullscreen
    ? { width: "100%", height: "100%", position: "absolute", inset: 0 }
    : { width: size, height: size * 1.15, borderRadius: 16, overflow: "hidden" };

  return (
    <div style={containerStyle}>
      <Canvas
        camera={{ position: [0, 0.25, 1.7], fov: 40 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.6,
        }}
        style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor("#00000000", 0);
          (camera as THREE.PerspectiveCamera).lookAt(0, 0.15, 0);
        }}
      >
        {/* Programmatic environment map for reflections */}
        <SceneEnv />

        {/* Key light — main front illumination */}
        <directionalLight position={[0, 3, 5]} intensity={2.5} color="#ffffff" castShadow />
        {/* Fill lights — soften shadows */}
        <directionalLight position={[-3, 2, 3]} intensity={1.0} color="#ffffff" />
        <directionalLight position={[3, 1, 3]} intensity={0.8} color="#ffffff" />
        {/* Under fill — lift chin/neck shadows */}
        <pointLight position={[0, -0.5, 3]} intensity={0.5} color="#ffffff" />
        {/* Rim/back light — edge definition */}
        <directionalLight position={[0, 2, -3]} intensity={0.5} color="#ffffff" />
        {/* Ambient — baseline so nothing is pure black */}
        <ambientLight intensity={0.7} color="#ffffff" />

        <Suspense fallback={<LoadingIndicator />}>
          <AvatarModel visemeRef={visemeRef} isSpeaking={isSpeaking} />
        </Suspense>
      </Canvas>
    </div>
  );
}
