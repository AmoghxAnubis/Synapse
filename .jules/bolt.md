## 2024-05-15 - [CustomCursor Animation Optimization]
**Learning:** The CustomCursor component in `frontend/components/CustomCursor.tsx` was running a continuous `requestAnimationFrame` loop that modified DOM styles directly every frame, even when the mouse was completely stationary. This caused unnecessary main-thread overhead.
**Action:** Introduced an early-return check inside the `requestAnimationFrame` loop to skip DOM updates when the mouse hasn't moved and its hover state hasn't changed. Added `{ passive: true }` to mouse event listeners to improve scroll performance. Always look for ways to pause animation loops when the target element is idle.
## 2024-05-16 - [WebGL Math.sqrt Bottleneck]
**Learning:** In hot WebGL/Canvas loops (like `useFrame` in `@react-three/fiber`), `Math.sqrt` used for distance checking (e.g., mouse attraction or particle connections) introduces unnecessary CPU overhead per frame.
**Action:** Always use squared distance checks (`dx*dx + dy*dy < DISTANCE_SQ`) instead of `Math.sqrt(dx*dx + dy*dy) < DISTANCE` for distance comparisons to minimize CPU usage. Only call `Math.sqrt` inside the conditional if the actual distance value is strictly needed later.
