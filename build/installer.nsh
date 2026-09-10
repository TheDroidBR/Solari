!macro customInit
  ; Check if --updated is present in the command line (passed by electron-updater during auto-update)
  ${GetParameters} $R0
  ClearErrors
  ${GetOptions} $R0 "--updated" $R1
  IfErrors check_updated_slash
  SetSilent silent
  Goto done

check_updated_slash:
  ClearErrors
  ${GetOptions} $R0 "/updated" $R1
  IfErrors done
  SetSilent silent

done:
!macroend
