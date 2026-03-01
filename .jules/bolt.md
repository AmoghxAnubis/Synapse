## 2024-05-15 - [CustomCursor Animation Optimization]
**Learning:** The CustomCursor component in `frontend/components/CustomCursor.tsx` was running a continuous `requestAnimationFrame` loop that modified DOM styles directly every frame, even when the mouse was completely stationary. This caused unnecessary main-thread overhead.
**Action:** Introduced an early-return check inside the `requestAnimationFrame` loop to skip DOM updates when the mouse hasn't moved and its hover state hasn't changed. Added `{ passive: true }` to mouse event listeners to improve scroll performance. Always look for ways to pause animation loops when the target element is idle.

## 2024-06-20 - [NeuralMesh WebGL Render Loop Optimization]
**Learning:** `NeuralMesh.tsx` executed ~11,175 `Math.sqrt` calls *every single frame* within its unoptimized `O(n^2)` particle connection loop and mouse attraction calculations. This resulted in significant CPU bottlenecks during React Three Fiber renders.
**Action:** Replaced direct `Math.sqrt` calculations with squared distance checks (`x*x + y*y < r*r`). `Math.sqrt` is now only computed for pairs that fall inside the threshold. This reduces expensive square root operations in WebGL render loops by over 90%. Always check distance against a squared radius before committing to a square root computation inside tight loops!
