"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import NeuralMesh from "./NeuralMesh";

export default function SynapticCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0">
            <Canvas
                frameloop={isInView ? "always" : "never"}
                camera={{ position: [0, 0, 6], fov: 50 }}
                style={{ position: "absolute", inset: 0 }}
                gl={{ alpha: true, antialias: true }}
            >
                <color attach="background" args={["transparent"]} />
                <ambientLight intensity={0.5} />
                <NeuralMesh />
                <EffectComposer enabled={isInView}>
                    <Bloom
                        luminanceThreshold={0.1}
                        luminanceSmoothing={0.9}
                        intensity={0.5}
                        mipmapBlur
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
