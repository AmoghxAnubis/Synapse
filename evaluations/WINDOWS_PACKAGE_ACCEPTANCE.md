# Windows installer prototype acceptance - 12 October 2026

The packaging target is an NSIS Windows x64 installer. Docker is outside this desktop distribution path. The payload bundles Python 3.12.10, the locked backend environment, Node v24.13.0 and a Next.js standalone frontend. Ollama and model downloads remain explicit setup steps.

## Artifact and provenance

- Corrected installer: `dist/Synapse-Windows-x64-beta-setup.exe` (113,076,027 bytes, approximately 108 MiB).
- SHA-256: `04fcddb0ea5c1ab470609058e6fcf165cb7374a3e62b8412311959f63eeb435c`.
- Staged payload: 17,238 files, approximately 585 MiB. `package-manifest.json` records source revision, runtime versions, backend lock hash and per-file hashes.
- Node's official archive was verified against its published SHASUMS256. NSIS 3.13 was obtained through winget, which verified its installer hash; initial SourceForge ZIP attempts returned HTML and were not executed.
- `.env` files, credentials, original stores and model assets are excluded. Runtime/package licenses are retained. Redistribution/license review remains C01 work.
- Generated artifacts are ignored by Git. The first failed/uncorrected staging attempts are not release candidates; use the corrected artifact named above.

## Checks

Standalone frontend build and strict lint passed. Relocated Python imports passed. Native ONNX embeddings and Chroma ingestion worked directly in the bundled environment. Startup using bundled Python/Node passed without relying on host runtime selection.

The initial supervised API's first memory request hung while lazily importing NumPy in a worker thread. A stack trace identified that import path. The launcher now initializes NumPy and ONNX Runtime on the main thread before starting its stdin watcher/API workers. An installed-bundle browser check then passed pairing, document import, a local cited answer naming Mira Patel, opening the evidence source, no missing static assets, no page errors and no mobile viewport overflow.

`scripts/verify_windows_bundle.py` reproduces the supervised stdin/log configuration, checks first-load sources, performs real ONNX/Chroma ingestion and verifies shutdown/port release with disposable data. It passed against the corrected final bundle and fresh installed files. The installer installed into a new test directory; the installed frontend/backend launcher smoke passed. Uninstall/data-preservation results are recorded in the tracker after the final test completes.

The initial temporary installation/uninstall also preserved its separate synthetic database and pairing token. No existing user workspace was migrated or deleted. Source/runtime manifests and the corrected installer must be kept together for reproduction.

## Remaining gates

The installer is unsigned and remains a beta prototype. A clean second-machine setup with no development runtimes, full model onboarding, installed restart/backup/restore, signing, automatic update/rollback, crash recovery and independent product/quality acceptance remain open. The beta installer refuses an existing installation directory; uninstall/reinstall is explicit and separate data is retained.

References: [NSIS user execution level](https://nsis.sourceforge.io/Reference/RequestExecutionLevel), [NSIS scripting](https://nsis.sourceforge.io/Docs/Chapter4.html), [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
