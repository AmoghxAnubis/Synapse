"use client";

import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import NeuralMesh from "./NeuralMesh";

export default function SynapticCanvas() {
    return (
        <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            style={{ position: "absolute", inset: 0 }}
            gl={{ alpha: true, antialias: true }}
        >
            <color attach="background" args={["transparent"]} />
            <ambientLight intensity={0.5} />
            <NeuralMesh />
            <EffectComposer>
                <Bloom
                    luminanceThreshold={0.1}
                    luminanceSmoothing={0.9}
                    intensity={0.5}
                    mipmapBlur
                />
            </EffectComposer>
        </Canvas>
    );
}
