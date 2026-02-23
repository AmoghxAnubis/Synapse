📂 Synapse Landing Page: "System Boot" Intro Preloader
Target AI Engine: Google Antigravity (Planning Mode)
Architecture: Next.js (App Router), Tailwind CSS, Framer Motion
Design Aesthetic: "Evalis-Inspired" (Sleek, deep dark mode, high-contrast typography, premium easing curves).
Objective: Create a full-screen, un-skippable intro animation (lasting ~2.5 seconds). It will cycle through 4-5 short "hooks" detailing the core value of Synapse, culminating in an elegant slide-up exit that reveals the main landing page.

1. Module Overview & Behavior
The Overlay: A fixed, z-[999] full-screen div with a solid, deep background color (bg-[#09090B]).

The Typographic Hooks: Centered on the screen is a single line of large, clean sans-serif text. As the animation runs, the text instantly swaps (or quickly fades) through a sequence of phrases.

The Exit: Once the final phrase finishes, the entire dark overlay slides UP (y: '-100%') off the screen using a custom cubic-bezier easing curve, revealing the hero section underneath.

State Management: Once the animation completes, the component should unmount itself so it doesn't block interactions on the main page.

2. Content Strategy (The Hooks)
Instead of "Hello, Bonjour, Hola", we will use short, punchy technical phrases that build anticipation:

"Bypassing the cloud..."

"Initializing local memory..."

"Connecting hardware acceleration..."

"Securing private context..."

"Synapse Core Online." (This final one stays on screen slightly longer before the slide-up).

3. Component Architecture
A. The Preloader Wrapper (components/Landing/IntroPreloader.tsx)
Function: Manages the framer-motion sequence and the React useState for which phrase is currently active.

Layout: fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-white.

Motion Logic: * Use AnimatePresence to handle the text swapping.

Use a useEffect with a setInterval (e.g., every 400ms) to increment the index of the phrases array.

After the array ends, trigger the parent container's exit animation.

B. Integration into Layout (app/layout.tsx or app/page.tsx)
Function: We must render this component at the very top of the DOM tree so it covers everything upon initial page load.

4. Antigravity Agent Execution Plan (Tasks)
Agent Instructions: Execute the following tasks sequentially to build the "System Boot" Preloader.

Task 1: Scaffold the Component

Create a new file: components/Landing/IntroPreloader.tsx.

Import useState, useEffect from React, and motion, AnimatePresence from framer-motion.

Define the array of hooks: ["Bypassing the cloud...", "Initializing local memory...", "Connecting hardware acceleration...", "Securing private context...", "Synapse Core Online."].

Task 2: Build the Sequence Logic (The Timer)

Inside the component, initialize const [index, setIndex] = useState(0).

Initialize const [isLoading, setIsLoading] = useState(true).

Create a useEffect that runs a timer. Every ~350ms, increment index. If index reaches the end of the array, clear the timer, wait ~600ms, and set isLoading(false).

Task 3: Build the Text Animation

Inside the UI render, use <AnimatePresence mode="wait">.

Render the current text hook inside a <motion.h1> tag.

Give the text a sleek entrance/exit: initial={{ opacity: 0, y: 10 }}, animate={{ opacity: 1, y: 0 }}, exit={{ opacity: 0, y: -10 }}, transition={{ duration: 0.2 }}.

Style the text to be large, tracking-tight, and highly legible (e.g., text-3xl md:text-5xl font-medium tracking-tighter text-zinc-100).

Task 4: Build the Overlay Slide-Up (The Exit)

Wrap the entire component in <AnimatePresence>.

When isLoading is true, render the full-screen <motion.div>.

The exit animation for the overlay MUST use a premium easing curve: exit={{ y: "-100%" }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}. (This is a classic "Expo" style easing).

Task 5: Prevent Body Scrolling

Add logic to apply overflow: hidden to the document body while isLoading is true, and remove it when the animation finishes, so the user can't scroll the page while the preloader is covering it.

Task 6: Inject into the App

Import <IntroPreloader /> into app/page.tsx and place it at the very top of the JSX return statement so it fires immediately when the user hits the landing page.