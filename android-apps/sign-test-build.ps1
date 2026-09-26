# Signs a Gradle release build of one GaitAI TWA with that app's TEST keystore
# and copies the result to android-builds/. Usage, from the repo root:
#
#   powershell -File android-apps\sign-test-build.ps1 mobilitycare
#   powershell -File android-apps\sign-test-build.ps1 securevision
#
# Prerequisites: `.\gradlew.bat assembleRelease bundleRelease` has run in
# android-apps\<app>\ (see docs/android-apps.md). The keystore password is
# the conventional test password "android"; these keys sign nothing that
# ships, and the keystores themselves are gitignored.
param([Parameter(Mandatory = $true)][ValidateSet("mobilitycare", "securevision")][string]$App)

$ErrorActionPreference = "Stop"
# apksigner and zipalign are Java tools; the machine-wide JAVA_HOME may point at
# a JDK that is no longer installed, so prefer the JDK Bubblewrap uses.
$Jdk = "$env:USERPROFILE\.bubblewrap\jdk17"
if (-not ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe"))) {
  if (Test-Path "$Jdk\bin\java.exe") { $env:JAVA_HOME = $Jdk } else { throw "No JDK: set JAVA_HOME or install one at $Jdk (see docs/android-apps.md)." }
}
$Root = Split-Path -Parent $PSScriptRoot
$Sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$Tools = Get-ChildItem "$Sdk\build-tools" | Sort-Object Name -Descending | Select-Object -First 1 | ForEach-Object FullName
$Proj = Join-Path $Root "android-apps\$App"
$Ks = Join-Path $Proj "keys\$App-test.keystore"
$Label = @{ mobilitycare = "GaitAI-MobilityCare"; securevision = "GaitAI-SecureVision" }[$App]
$Unsigned = Join-Path $Proj "app\build\outputs\apk\release\app-release-unsigned.apk"
$Aligned = Join-Path $Proj "app\build\outputs\apk\release\app-release-aligned.apk"
$Signed = Join-Path $Root "android-builds\$Label-debug.apk"
$Bundle = Join-Path $Proj "app\build\outputs\bundle\release\app-release.aab"

if (-not (Test-Path $Unsigned)) { throw "No release APK at $Unsigned - run gradlew assembleRelease first." }
if (-not (Test-Path $Ks)) { throw "No test keystore at $Ks - see docs/android-apps.md (Signing)." }

& "$Tools\zipalign.exe" -f -p 4 $Unsigned $Aligned
& "$Tools\apksigner.bat" sign --ks $Ks --ks-key-alias "$App-test" --ks-pass pass:android --key-pass pass:android --out $Signed $Aligned
& "$Tools\apksigner.bat" verify --print-certs $Signed | Select-String "Signer #1 certificate SHA-256|Verifies"
if (Test-Path $Bundle) { Copy-Item $Bundle (Join-Path $Root "android-builds\$Label-test.aab") -Force }
if (-not (Test-Path $Signed)) { throw "apksigner produced no output at $Signed" }
Write-Host "Signed test APK: $Signed"
