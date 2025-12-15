; Custom NSIS installer script for Cosmic IDE
; This script customizes the installer behavior

!macro preInit
  ; Set registry view to 64-bit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
!macroend

!macro customInstall
  ; Create file associations
  WriteRegStr HKCR ".js" "" "CosmicIDE.JSFile"
  WriteRegStr HKCR ".ts" "" "CosmicIDE.TSFile"
  WriteRegStr HKCR ".jsx" "" "CosmicIDE.JSXFile"
  WriteRegStr HKCR ".tsx" "" "CosmicIDE.TSXFile"
  WriteRegStr HKCR ".py" "" "CosmicIDE.PYFile"
  WriteRegStr HKCR ".rs" "" "CosmicIDE.RSFile"
  WriteRegStr HKCR ".json" "" "CosmicIDE.JSONFile"
  WriteRegStr HKCR ".md" "" "CosmicIDE.MDFile"
  
  ; Register as default editor option
  WriteRegStr HKCR "CosmicIDE.JSFile" "" "JavaScript File"
  WriteRegStr HKCR "CosmicIDE.JSFile\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCR "CosmicIDE.JSFile\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  
  WriteRegStr HKCR "CosmicIDE.TSFile" "" "TypeScript File"
  WriteRegStr HKCR "CosmicIDE.TSFile\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCR "CosmicIDE.TSFile\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  
  ; Add to Windows "Open with" context menu
  WriteRegStr HKCR "*\shell\CosmicIDE" "" "Open with Cosmic IDE"
  WriteRegStr HKCR "*\shell\CosmicIDE" "Icon" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "*\shell\CosmicIDE\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  
  ; Add folder context menu
  WriteRegStr HKCR "Directory\shell\CosmicIDE" "" "Open folder in Cosmic IDE"
  WriteRegStr HKCR "Directory\shell\CosmicIDE" "Icon" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "Directory\shell\CosmicIDE\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  ; Remove file associations
  DeleteRegKey HKCR "CosmicIDE.JSFile"
  DeleteRegKey HKCR "CosmicIDE.TSFile"
  DeleteRegKey HKCR "CosmicIDE.JSXFile"
  DeleteRegKey HKCR "CosmicIDE.TSXFile"
  DeleteRegKey HKCR "CosmicIDE.PYFile"
  DeleteRegKey HKCR "CosmicIDE.RSFile"
  DeleteRegKey HKCR "CosmicIDE.JSONFile"
  DeleteRegKey HKCR "CosmicIDE.MDFile"
  
  ; Remove context menu entries
  DeleteRegKey HKCR "*\shell\CosmicIDE"
  DeleteRegKey HKCR "Directory\shell\CosmicIDE"
!macroend