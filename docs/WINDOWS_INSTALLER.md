# Windows installer build

The distribution target is an NSIS Windows x64 `.exe` installer with a bundled Python 3.12 runtime, backend dependencies, Node runtime and Next.js standalone frontend. It installs per user without administrator rights. The installed launcher opens the local browser workspace and keeps a terminal available for Ctrl+C shutdown.

Ollama and embedding/generation models remain explicit setup prerequisites. User data stays under `%LOCALAPPDATA%\Synapse\data`, separately from application files. No credentials, `.env` files, existing stores or model binaries are included in the package.

## Build

Use a Windows x64 Python 3.12 virtual environment installed from `backend/requirements.lock.txt`. Install frontend dependencies and run `npm.cmd run build`; Next.js `output: standalone` generates the runtime. Obtain an official supported Node Windows x64 ZIP and verify it against that release's `SHASUMS256.txt`. Extract it with its LICENSE. Use the official NSIS compiler.

From the checkout root:

```powershell
backend/venv/Scripts/python.exe scripts/build_windows_package.py --node-dir 'PATH\TO\node-win-x64' --output 'dist\synapse-win-x64' --nsis 'PATH\TO\makensis.exe'
```

Output directories must be new; the builder refuses to overwrite a package. Without `--nsis`, it stages the bundle only. The package manifest records runtime versions, source commit, lock hash and payload hashes. Third-party Python package metadata/licenses, Python's license and Node's license accompany their runtimes. Final redistribution/license review remains C01 work.

Test the staged bundle from its own directory with `backend/runtime/python.exe scripts/launch_local.py --smoke --data-dir ABSOLUTE_TEST_DATA_PATH`. The launcher selects bundled Python/Node and standalone server automatically. Test browser pairing, source ingestion/answer, restart and uninstall with synthetic data before release.

Run the native first-load/import regression with `backend/venv/Scripts/python.exe scripts/verify_windows_bundle.py --bundle dist/synapse-win-x64 --embedding-dir PATH_TO_PROVISIONED_MINILM`. It uses disposable data and reproduces the supervised log/stdin configuration. See [installer acceptance results](../evaluations/WINDOWS_PACKAGE_ACCEPTANCE.md) for the corrected build tested here.

## Install and use

Run the generated setup executable. A Start-menu shortcut launches Synapse. The initial beta refuses installation into an existing directory; automatic upgrades/rollback remain pending. Stop the launcher before uninstalling. Uninstall removes application files and shortcuts and retains the separate data/models.

Provision embeddings using the installed runtime from a terminal:

```powershell
$env:SYNAPSE_DATA_DIR = Join-Path $env:LOCALAPPDATA 'Synapse\data'
Set-Location "$env:LOCALAPPDATA\Programs\Synapse\backend"
./runtime/python.exe -m app.provision
```

Install/start Ollama, explicitly pull an appropriate model, and select it in Settings. Pair using the token file in the data directory. Missing models leave setup/settings available; startup does not download models.

This is an unsigned beta installer. Signing, update/rollback, crash recovery, full model onboarding, second-machine acceptance and commercial licensing review remain open. See [SECOND_MACHINE_ACCEPTANCE.md](SECOND_MACHINE_ACCEPTANCE.md) in the repository.

Official references: [NSIS execution levels](https://nsis.sourceforge.io/Reference/RequestExecutionLevel), [NSIS scripting](https://nsis.sourceforge.io/Docs/Chapter4.html), [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
