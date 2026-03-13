## 2024-05-15 - [CustomCursor Animation Optimization]
**Learning:** The CustomCursor component in `frontend/components/CustomCursor.tsx` was running a continuous `requestAnimationFrame` loop that modified DOM styles directly every frame, even when the mouse was completely stationary. This caused unnecessary main-thread overhead.
**Action:** Introduced an early-return check inside the `requestAnimationFrame` loop to skip DOM updates when the mouse hasn't moved and its hover state hasn't changed. Added `{ passive: true }` to mouse event listeners to improve scroll performance. Always look for ways to pause animation loops when the target element is idle.

## 2024-05-16 - [WebGL Render Loop Optimization]
**Learning:** The NeuralMesh component was computing `Math.sqrt` inside an O(N^2) inner loop every frame to calculate distances for particle connections and mouse interactions. This significantly impacted frame rendering times by running thousands of expensive sqrt operations unnecessarily.
**Action:** Replaced `Math.sqrt` calculations with squared distance comparisons (`dx * dx + dy * dy < thresholdSq`). We now only compute `Math.sqrt` if the initial threshold check passes and the exact linear distance is absolutely required for an effect (like lerping). Always default to squared distance checks for all WebGL/Canvas distance thresholding.
