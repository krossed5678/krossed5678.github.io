# Unregister the custom protocol `krossed5678:`
$protocol = 'krossed5678'
$regPath = "HKCU:\Software\Classes\$protocol"
if(Test-Path $regPath){ Remove-Item -Path $regPath -Recurse -Force; Write-Host "Protocol $protocol unregistered." } else { Write-Host "Protocol not registered." }