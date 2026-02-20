Here is the Interactive Footer Design Document, specifically formatted as an implementation spec for Google Antigravity.

Lusion is renowned for its world-class WebGL, fluid dynamics, and physics-based interactions. To replicate that level of premium, tactile interactivity for Synapse, we need to introduce a 3D canvas that reacts to the user's cursor. Since Synapse is an AI "brain," the perfect Lusion-style element is an interactive "Neural / Synaptic Particle Mesh"—a glowing constellation of nodes that gravitate towards the user's mouse and form connections (synapses) in real-time.

You can paste this directly into Antigravity’s Agent Manager to scaffold the WebGL component.

📂 Synapse OS Assistant: Interactive WebGL Footer Module
Target AI Engine: Google Antigravity (Planning Mode)
Architecture: Next.js (App Router), Tailwind CSS, React Three Fiber (R3F), Framer Motion
Design Aesthetic: "Lusion-Inspired" (Immersive WebGL, Cursor-Reactive Physics, Deep Space/Glassmorphic overlay)
Objective: Build a premium, highly interactive footer/CTA section where a 3D particle system physically reacts to the user's cursor, overlaid with the final Call-to-Action (CTA).

1. Module Overview & Behavior
The footer will act as the visual representation of the Synapse "Memory Bank" and "Orchestrator."

Visuals: A deep black/zinc background (#09090B). Inside, a 3D canvas renders hundreds of glowing particles (nodes) colored in our hardware accents (Emerald, Purple, Blue).

Interactivity: As the user moves their mouse over the footer section, the particles apply physics (spring forces) to gravitate toward the cursor. Nearby particles draw glowing lines between them, creating a "neural network" effect.

Overlay: Centered, crisp typography with a glassmorphic CTA button prompting the user to "Deploy Synapse Core."

2. Tech Stack & Dependencies
To achieve Lusion-level interactions in a Next.js environment without writing raw WebGL, we will use the React Three Fiber ecosystem:

3D Engine: three

React Wrapper: @react-three/fiber (R3F)

Helpers/Controls: @react-three/drei (for text, environment, and post-processing bloom)

Animations: framer-motion / framer-motion-3d (for smooth entry/exit animations)

3. Component Architecture
A. The Footer Wrapper (components/Footer/InteractiveFooter.tsx)
Function: The HTML/CSS container. Must have position: relative, w-full, and a substantial height (e.g., h-[60vh]) to give the user room to play with the particles.

Layout: Contains the underlying <Canvas> component and an overlaid absolute z-10 div for the HTML text and CTA button.

B. The 3D Canvas (components/Footer/SynapticCanvas.tsx)
Function: Renders the R3F <Canvas>.

Details: Includes Post-Processing. Specifically, an <EffectComposer> with a <Bloom> pass so the neural nodes actually glow against the dark background.

C. The Particle System (components/Footer/NeuralMesh.tsx)
Function: The core logic. Uses useFrame to update particle positions based on the cursor's (x, y) coordinates.

Math/Logic: * Generate an array of N Vector3 positions.

Use standard spring physics (or drei's <PointMaterial> and <Points> instances) to make them drift slowly.

Calculate distance to pointer: if distance < threshold, apply a velocity vector pulling the node toward the pointer.

D. The Overlay / CTA (components/Footer/FooterCTA.tsx)
Visuals: Huge, bold Next-Gen typography: "Ready to awaken your local workflow?"

Button: A sleek button labeled Initialize Synapse with an integrated glowing border and a hover state that slightly repels the background particles.

4. Antigravity Agent Execution Plan (Tasks)
Agent Instructions: Execute the following tasks sequentially to build the Interactive WebGL Footer.

Task 1: Install Dependencies

Run: npm install three @react-three/fiber @react-three/drei @react-three/postprocessing

Run: npm install -D @types/three

Task 2: Build the Neural Mesh Logic (components/Footer/NeuralMesh.tsx)

Create a component returning a <Points> instance from Three.js.

Inside, utilize useFrame((state) => { ... }) to read state.pointer.

Map the pointer position to 3D space. Apply a gentle lerp (linear interpolation) so particles within a certain radius slowly follow the mouse, while others drift randomly.

Task 3: Assemble the 3D Canvas (components/Footer/SynapticCanvas.tsx)

Set up the <Canvas> with a flat black background color (#09090B).

Add <ambientLight> and the <NeuralMesh />.

Import EffectComposer and Bloom from @react-three/postprocessing to give the particles a neon, sci-fi glow.

Task 4: Build the HTML Overlay & Button (components/Footer/FooterCTA.tsx)

Create the text overlay using standard Tailwind classes (absolute inset-0 flex flex-col items-center justify-center pointer-events-none).

Crucial: Set pointer-events-none on the text wrapper, but pointer-events-auto on the CTA button itself, so the user's cursor can still interact with the 3D canvas beneath the text.

Task 5: Integrate into Layout (components/Footer/InteractiveFooter.tsx)

Combine the SynapticCanvas (background) and FooterCTA (foreground) into a relative container.

Export this component and add it to the very bottom of the main app/page.tsx file.