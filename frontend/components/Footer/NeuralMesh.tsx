"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 150;
const CONNECTION_DISTANCE = 1.6;
const MOUSE_RADIUS = 3.0;
const LERP_SPEED = 0.025;

export default function NeuralMesh() {
    const pointsRef = useRef<THREE.Points>(null);
    const linesRef = useRef<THREE.LineSegments>(null);
    const { viewport } = useThree();

    // Generate initial positions & velocities
    const { positions, basePositions, velocities } = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const basePositions = new Float32Array(PARTICLE_COUNT * 3);
        const velocities = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 14;
            const y = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 4;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            basePositions[i * 3] = x;
            basePositions[i * 3 + 1] = y;
            basePositions[i * 3 + 2] = z;

            velocities[i * 3] = (Math.random() - 0.5) * 0.005;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
        }

        return { positions, basePositions, velocities };
    }, []);

    // Line geometry for connections
    const lineGeometry = useMemo(() => {
        const maxLines = PARTICLE_COUNT * 6;
        const geo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(maxLines * 6);
        const lineColors = new Float32Array(maxLines * 6);
        geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
        geo.setDrawRange(0, 0);
        return geo;
    }, []);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const geo = pointsRef.current.geometry;
        const posAttr = geo.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        // Map pointer to 3D
        const mx = (state.pointer.x * viewport.width) / 2;
        const my = (state.pointer.y * viewport.height) / 2;

        // Update particle positions
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ix = i * 3;
            const iy = ix + 1;
            const iz = ix + 2;

            // Gentle drift
            arr[ix] += velocities[ix];
            arr[iy] += velocities[iy];
            arr[iz] += velocities[iz];

            // Soft pull back to base
            arr[ix] += (basePositions[ix] - arr[ix]) * 0.002;
            arr[iy] += (basePositions[iy] - arr[iy]) * 0.002;
            arr[iz] += (basePositions[iz] - arr[iz]) * 0.002;

            // Mouse attraction
            const dx = mx - arr[ix];
            const dy = my - arr[iy];
            const distSq = dx * dx + dy * dy;

            if (distSq < MOUSE_RADIUS * MOUSE_RADIUS) {
                const dist = Math.sqrt(distSq);
                const force = (1 - dist / MOUSE_RADIUS) * LERP_SPEED;
                arr[ix] += dx * force;
                arr[iy] += dy * force;
            }

            // Wrap slowly drifting particles
            if (Math.abs(arr[ix]) > 8) velocities[ix] *= -1;
            if (Math.abs(arr[iy]) > 5) velocities[iy] *= -1;
        }

        posAttr.needsUpdate = true;

        // Update connections
        const linePos = lineGeometry.attributes.position.array as Float32Array;
        const lineCol = lineGeometry.attributes.color.array as Float32Array;
        let lineIdx = 0;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const dx = arr[i * 3] - arr[j * 3];
                const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
                const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
                const dSq = dx * dx + dy * dy + dz * dz;

                if (dSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
                    const d = Math.sqrt(dSq);
                    const alpha = 1 - d / CONNECTION_DISTANCE;
                    // zinc-500 tone: rgb(113, 113, 122) → normalized
                    const r = 0.44;
                    const g = 0.44;
                    const b = 0.48;

                    const idx = lineIdx * 6;
                    linePos[idx] = arr[i * 3];
                    linePos[idx + 1] = arr[i * 3 + 1];
                    linePos[idx + 2] = arr[i * 3 + 2];
                    linePos[idx + 3] = arr[j * 3];
                    linePos[idx + 4] = arr[j * 3 + 1];
                    linePos[idx + 5] = arr[j * 3 + 2];

                    lineCol[idx] = r * alpha;
                    lineCol[idx + 1] = g * alpha;
                    lineCol[idx + 2] = b * alpha;
                    lineCol[idx + 3] = r * alpha;
                    lineCol[idx + 4] = g * alpha;
                    lineCol[idx + 5] = b * alpha;

                    lineIdx++;
                    if (lineIdx >= PARTICLE_COUNT * 6) break;
                }
            }
            if (lineIdx >= PARTICLE_COUNT * 6) break;
        }

        lineGeometry.setDrawRange(0, lineIdx * 2);
        (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (lineGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    });

    return (
        <group>
            {/* Particles */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[positions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.07}
                    color="#71717a"
                    transparent
                    opacity={0.9}
                    sizeAttenuation
                    depthWrite={false}
                />
            </points>

            {/* Connection lines */}
            <lineSegments ref={linesRef} geometry={lineGeometry}>
                <lineBasicMaterial
                    vertexColors
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                />
            </lineSegments>
        </group>
    );
}
