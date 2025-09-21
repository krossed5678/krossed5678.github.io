# Register a custom URL protocol `krossed5678:` to launch launch-site.bat
# Run in an elevated (Administrator) PowerShell prompt if necessary.

$scriptPath = Join-Path $PSScriptRoot 'launch-site.bat'
# Command stored in registry should be: "C:\path\to\launch-site.bat" "%1"
$cmd = '"' + $scriptPath + '" "%1"'

$protocol = 'krossed5678'
$regPath = "HKCU:\Software\Classes\$protocol"

Write-Host "Registering protocol $protocol -> $scriptPath"
New-Item -Path $regPath -Force | Out-Null
New-ItemProperty -Path $regPath -Name '(Default)' -Value "URL:$protocol Protocol" -Force | Out-Null
New-ItemProperty -Path $regPath -Name 'URL Protocol' -Value '' -Force | Out-Null

$commandKey = Join-Path $regPath 'shell\open\command'
New-Item -Path $commandKey -Force | Out-Null
Write-Host "Writing command to registry: $cmd"
New-ItemProperty -Path $commandKey -Name '(Default)' -Value $cmd -Force | Out-Null

Write-Host ("Protocol registered. You can now use: {0}://open" -f $protocol)
Write-Host "To unregister run unregister-protocol.ps1"