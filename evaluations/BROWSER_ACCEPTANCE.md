# Browser workflow acceptance - 11 October 2026

This is a focused assistant-run acceptance check of the production frontend, real local API, ONNX document ingestion and `llama3:latest`. It does not complete human usability or general answer-quality acceptance.

## Environment and scope

- Windows, production Next.js server on loopback, isolated headless Chrome through Playwright.
- Desktop 1440 x 900; mobile layout and status-panel follow-up at 390 x 844; reduced-motion preference.
- Disposable backend storage under ignored `.tmp/browser-journey/data`, using the provisioned local embedding model. The installed Ollama model was selected through Settings in this disposable store.
- No private input documents, shared browser profile, or external connector was used.

## Browser journey and results

1. Open the protected dashboard, pair using the disposable backend token, then select `llama3:latest` in Settings. The UI reports that Ollama is ready.
2. Import `harbor-browser-acceptance.md` through the file input. Its synthetic facts are: launch on 18 November 2026; owner Mira Patel; weekday support 09:00-17:00 UTC; two release reviewers; restore the last verified backup before reopening imports.
3. Open Chat, type `@harbor`, and select the source with ArrowDown and Enter. Ask: "When does the Harbor project launch, and who is the launch owner?"
4. The real model returned: "The Harbor project launches on 18 November 2026, and the launch owner is Mira Patel. [1]" Expand Evidence and open its source link; the imported passage contains both facts.
5. Reopen the saved conversation. Start a second answer and click Stop answer. Reload and reopen the conversation: only the original two messages are saved. Repeat after the UI fix below; the same persistence result holds.
6. Tab through navigation, status controls, conversation controls and Evidence. After the fix, all 15 observed focus stops have names and remain in the viewport.
7. At mobile width, open system status using its button. The panel and conversation have no horizontal viewport overflow. No browser page errors were observed.

## Issues fixed

- Cancellation left an empty assistant bubble saying "Preparing an answer". Stopped/failed response states now replace the pending indicator and identify the unsaved turn. A conversation-list refresh error after a successful answer is handled separately so it cannot label the completed answer as failed.
- Keyboard focus entered the status bar while its links were offscreen. It now reveals focused links and has a named, clickable disclosure control. The settings icon has an accessible name, and status content wraps on narrow screens.

Strict frontend lint with zero warnings and the production build passed. The relevant browser cancellation, persistence, focus and mobile checks passed after the fixes. Local detailed output and screenshots are under ignored `.tmp/browser-check/`; they are disposable, not required application assets.

## Remaining acceptance

Human first-use review, wider dashboard route/design review, import cancellation, full animation/canvas review, representative answer quality, and second-machine installation/recovery remain open. This single synthetic browser answer is workflow evidence, not a new Q01 quality holdout or a performance benchmark.
