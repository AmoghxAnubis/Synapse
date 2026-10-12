Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!ifndef PAYLOAD
  !error "Pass /DPAYLOAD=staged_bundle"
!endif
!ifndef OUTPUT
  !error "Pass /DOUTPUT=installer.exe"
!endif
Name "Synapse Local Beta"
OutFile "${OUTPUT}"
InstallDir "$LOCALAPPDATA\Programs\Synapse"
RequestExecutionLevel user
SetCompressor /SOLID lzma
ShowInstDetails show
ShowUninstDetails show
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "This beta requires 64-bit Windows."
    Abort
  ${EndIf}
  IfFileExists "$INSTDIR\." occupied fresh
  occupied:
    MessageBox MB_ICONSTOP "The installation directory already exists. This beta supports a fresh install. Stop and uninstall the previous version first; your separate Synapse data is retained."
    Abort
  fresh:
FunctionEnd

Section "Synapse"
  SetShellVarContext current
  SetRegView 64
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD}\*"
  FileOpen $0 "$INSTDIR\synapse-install-owner.txt" w
  FileWrite $0 "synapse-beta-installer-v1"
  FileClose $0
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Synapse"
  CreateShortCut "$SMPROGRAMS\Synapse\Synapse.lnk" "$INSTDIR\backend\runtime\python.exe" '$\"$INSTDIR\scripts\launch_local.py$\" --open-browser'
  CreateShortCut "$SMPROGRAMS\Synapse\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SynapseLocalBeta" "DisplayName" "Synapse Local Beta"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SynapseLocalBeta" "DisplayVersion" "0.2.0-beta.1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SynapseLocalBeta" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SynapseLocalBeta" "InstallLocation" "$INSTDIR"
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  SetRegView 64
  FileOpen $0 "$INSTDIR\synapse-install-owner.txt" r
  IfErrors unsafe
  FileRead $0 $1
  FileClose $0
  StrCmp $1 "synapse-beta-installer-v1" owned unsafe
  unsafe:
    MessageBox MB_ICONSTOP "Installation ownership marker is missing. No files were removed."
    Abort
  owned:
  nsExec::ExecToStack '$\"$INSTDIR\backend\runtime\python.exe$\" $\"$INSTDIR\scripts\launch_local.py$\" --check'
  Pop $0
  Pop $1
  StrCmp $0 "0" stopped
    MessageBox MB_ICONSTOP "Close Synapse and any local services on ports 3000/8000 before uninstalling. If runtime files are damaged, repair them before uninstalling."
    Abort
  stopped:
  ; Remove only owned application subdirectories; never the per-user data tree.
  RMDir /r "$INSTDIR\backend"
  RMDir /r "$INSTDIR\frontend"
  RMDir /r "$INSTDIR\runtime"
  RMDir /r "$INSTDIR\scripts"
  RMDir /r "$INSTDIR\docs"
  Delete "$INSTDIR\Start-Synapse.cmd"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\package-manifest.json"
  Delete "$INSTDIR\synapse-install-owner.txt"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Synapse\Synapse.lnk"
  Delete "$SMPROGRAMS\Synapse\Uninstall.lnk"
  RMDir "$SMPROGRAMS\Synapse"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SynapseLocalBeta"
SectionEnd
