# Windows launcher prototype

The D02 launcher is a foreground supervisor for a checkout or installed bundle. It starts the real backend and production frontend and stops its own processes when you press Ctrl+C. Checkout mode requires Python 3.12, Node 22.13 or newer, locked backend dependencies and a built frontend; use the [README setup](../README.md#setup-on-windows). The [NSIS bundle](WINDOWS_INSTALLER.md) selects its bundled Python/Node and standalone frontend automatically.

From the checkout root:

```powershell
.\Start-Synapse.cmd --check
.\Start-Synapse.cmd --open-browser
```

Keep that terminal open. Ctrl+C stops both services. The backend receives a shutdown request through its private stdin pipe so its lifespan can close jobs and stores. The frontend is stopped first. An unexpected service exit stops the other service. If shutdown exceeds 30 seconds, the launcher reports and terminates its own process. It never stops an existing service occupying a port.

Windows may then ask `Terminate batch job (Y/N)?` for the `.cmd` wrapper; answer Y. To avoid that shell prompt, invoke `backend/venv/Scripts/python.exe scripts/launch_local.py` directly with the same options.

## Data and models

The default data location is `%LOCALAPPDATA%\Synapse\data`; logs are in its `logs` directory. Existing checkout data is not automatically migrated. To preserve an existing workspace, explicitly pass its absolute data path, or follow the README backup/restore procedure before changing directories.

To provision embeddings for the default launcher location, from the checkout root:

```powershell
$env:SYNAPSE_DATA_DIR = Join-Path $env:LOCALAPPDATA 'Synapse\data'
$env:SYNAPSE_EMBEDDING_DIR = Join-Path $env:SYNAPSE_DATA_DIR 'models\minilm'
Push-Location backend
./venv/Scripts/python.exe -m app.provision
Pop-Location
```

This is an explicit network download. Select an installed local Ollama model in Settings. Missing models are reported; the launcher still allows pairing/settings, and it never downloads models or dependencies on startup.

Optional overrides:

```powershell
.\Start-Synapse.cmd --data-dir 'E:\SynapseData' --embedding-dir 'E:\SynapseModels\minilm'
.\Start-Synapse.cmd --node 'C:\Program Files\nodejs\node.exe' --check
```

The second example selects a specific Node installation when PATH chooses an older one. Launcher path options override inherited data/model/backend-URL environment values for its children. The default model directory follows the chosen data directory. Other backend settings from `.env` still apply. The launcher prints the pairing-token file path, never its contents.

For backup/restore commands in a separate terminal, set `SYNAPSE_DATA_DIR` to the same launcher data directory. The environment passed to services does not change your parent terminal.

## Verification and remaining distribution work

```powershell
backend/venv/Scripts/python.exe scripts/verify_launcher.py --node 'C:\Program Files\nodejs\node.exe'
```

This uses disposable data, starts and stops real processes twice, verifies metadata/token preservation and released ports, and confirms an occupied port is refused without stopping its listener. Both application ports must be free before running it.

Checkout mode depends on the installed virtual environment, Node and frontend build. The NSIS prototype bundles those runtimes. Ollama/models, complete setup onboarding, OS service/autostart, crash recovery, signing and updates/rollback remain separate work. Verify the installed package on another Windows machine using [SECOND_MACHINE_ACCEPTANCE.md](SECOND_MACHINE_ACCEPTANCE.md) before completing D01/D02.
