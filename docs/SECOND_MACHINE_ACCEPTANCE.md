# Second Windows machine acceptance

Prepared 12 October 2026. This procedure is ready to run; a second-machine result has not been recorded. Use a separate Windows computer and a fresh checkout of `main`. Record the commit, Windows version, RAM, CPU, Python/Node versions and installed Ollama model. Use synthetic data until this procedure passes.

## Install and configure

1. Install stable Python 3.12, Node 22.13 or newer, Git and Ollama. Follow [README setup](../README.md#setup-on-windows) to install the locked backend/frontend dependencies and build the frontend. Keep the installation logs without pairing tokens.
2. Put acceptance data outside the checkout. In each backend, provisioning, smoke or backup terminal, set:

   ```powershell
   $synapseAcceptanceRoot = Join-Path $env:LOCALAPPDATA 'SynapseAcceptance'
   $env:SYNAPSE_DATA_DIR = Join-Path $synapseAcceptanceRoot 'data'
   ```

   Leave `SYNAPSE_EMBEDDING_DIR` unset so provisioning uses this data directory. From `backend`, run `./venv/Scripts/python.exe -m app.provision`. This explicitly downloads the embedding model. Confirm an installed Ollama model; `llama3:latest` is the model used in the current browser acceptance sample. Pull it explicitly if needed. Confirm the selected model in Settings.
3. Start the backend and production frontend using the README commands. Open `http://127.0.0.1:3000`. Pair using the `api-token` file in the acceptance data directory. Keep the token out of reports.

## Check the workflow, restart and offline use

| Check | Expected result | Result / evidence |
| --- | --- | --- |
| Clean setup | Locked installation and production build succeed; no runtime data is created in the checkout | Pending |
| Launcher | Run Start-Synapse.cmd with --data-dir pointing to this acceptance data directory; startup, Ctrl+C stop and restart preserve data. Do not mix manually started services with the launcher | Pending |
| Pairing | An unpaired dashboard redirects to pairing; correct token opens chat | Pending |
| Import | Import [harbor.md](acceptance/harbor.md); source view preserves the facts | Pending |
| Answer and evidence | Ask when Harbor launches and who owns it; answer states 18 November 2026 and Mira Patel with a supporting reference | Pending |
| Scope and history | Select the source using `@`; reopen the saved conversation and inspect its evidence | Pending |
| Reimport | Import the same file again; it is reported up to date without duplicate passages | Pending |
| Cancel | Stop an answer and cancel a larger synthetic import; completed history remains and an import cancelled before replacement adds no partial source | Pending |
| Restart | Stop both services, restart them, and verify sources, conversation, model settings and meeting notes remain | Pending |
| Offline | After all provisioning, disconnect the machine's external network and repeat the local import/answer workflow with connected features off | Pending |
| Browser smoke | From the checkout root, with the same data-directory environment, run `backend/venv/Scripts/python.exe scripts/verify_local.py --with-inference`; retain the output and any failure | Pending |

A smoke failure remains a failure until diagnosed. Model-generated omissions must not be waived merely because the services started.

## Backup and restore

Stop the backend first. In a terminal with the acceptance environment above, from `backend`:

```powershell
New-Item -ItemType Directory -Force -Path $synapseAcceptanceRoot | Out-Null
$synapseBackupPath = Join-Path $synapseAcceptanceRoot ('backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.zip')
$synapseRestorePath = Join-Path $synapseAcceptanceRoot ('restored-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
./venv/Scripts/python.exe -m app.backup create $synapseBackupPath
./venv/Scripts/python.exe -m app.backup restore $synapseBackupPath --target $synapseRestorePath
$env:SYNAPSE_DATA_DIR = $synapseRestorePath
./venv/Scripts/python.exe -m app.provision
./venv/Scripts/python.exe -m app.main
```

The restore target must be new. Re-pair using its new token and verify sources, cited answers, saved conversations, notes and model settings. Connections should be disconnected after restore. Backups exclude model binaries and credentials, so provisioning and pairing are intentional steps. Preserve the original acceptance data until restoration is verified.

Record pass/fail, the relevant log or screenshot and the observed defect for each row. D01 can be completed after the second-machine setup, restart and offline checks pass. Installed packaging, updates and rollback remain D02/D03 work.
