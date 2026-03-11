## 2024-05-15 - [CustomCursor Animation Optimization]
**Learning:** The CustomCursor component in `frontend/components/CustomCursor.tsx` was running a continuous `requestAnimationFrame` loop that modified DOM styles directly every frame, even when the mouse was completely stationary. This caused unnecessary main-thread overhead.
**Action:** Introduced an early-return check inside the `requestAnimationFrame` loop to skip DOM updates when the mouse hasn't moved and its hover state hasn't changed. Added `{ passive: true }` to mouse event listeners to improve scroll performance. Always look for ways to pause animation loops when the target element is idle.

## 2024-05-18 - [WebGL Math Optimization]
**Learning:** In WebGL render loops using `@react-three/fiber`, calling `Math.sqrt` unconditionally inside nested loops (like calculating particle pair distances) can cause massive CPU overhead since it runs every single frame. The `NeuralMesh` component was calling `Math.sqrt` O(n^2) times per frame for 150 particles (over 11,000 times/frame).
**Action:** Replaced distance calculations with squared distance checks (`dx*dx + dy*dy + dz*dz`) against a squared threshold, only calling `Math.sqrt` when the threshold condition is met and the actual distance is needed.
