## 2024-05-15 - [CustomCursor Animation Optimization]
**Learning:** The CustomCursor component in `frontend/components/CustomCursor.tsx` was running a continuous `requestAnimationFrame` loop that modified DOM styles directly every frame, even when the mouse was completely stationary. This caused unnecessary main-thread overhead.
**Action:** Introduced an early-return check inside the `requestAnimationFrame` loop to skip DOM updates when the mouse hasn't moved and its hover state hasn't changed. Added `{ passive: true }` to mouse event listeners to improve scroll performance. Always look for ways to pause animation loops when the target element is idle.

## 2025-03-05 - [Squared Distances for WebGL Render Loops]
**Learning:** In the `NeuralMesh` component's `useFrame` render loop, calculating the distance using `Math.sqrt` was a performance bottleneck as it iterated over 150 particles, resulting in over 11,000 potential connections checked per frame. Calculating square roots in an inner animation loop heavily utilizes the CPU, causing lag.
**Action:** Use squared distances (`dx * dx + dy * dy`) instead of `Math.sqrt` for distance comparisons within tight `requestAnimationFrame` and WebGL render loops whenever exact distances are only needed after confirming a threshold is met.
