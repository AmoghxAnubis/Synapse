## 2024-05-15 - [CustomCursor Animation Optimization]
**Learning:** The CustomCursor component in `frontend/components/CustomCursor.tsx` was running a continuous `requestAnimationFrame` loop that modified DOM styles directly every frame, even when the mouse was completely stationary. This caused unnecessary main-thread overhead.
**Action:** Introduced an early-return check inside the `requestAnimationFrame` loop to skip DOM updates when the mouse hasn't moved and its hover state hasn't changed. Added `{ passive: true }` to mouse event listeners to improve scroll performance. Always look for ways to pause animation loops when the target element is idle.
## 2025-01-20 - [Distance Check Optimization in ThreeJS loops]
**Learning:** `Math.sqrt` is expensive inside hot render loops (like `useFrame` or `requestAnimationFrame`). Using squared distance checks (dx² + dy² < radius²) avoids thousands of square root calculations per frame without changing the logic.
**Action:** Always pre-calculate squared radius values and use squared distance checks first. Only compute actual distance (via `Math.sqrt`) if needed (e.g. for alpha/force interpolation) AFTER the bounding check passes.
