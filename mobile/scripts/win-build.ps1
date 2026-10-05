# Builds one GaitAI native app on Windows, working around the 260-character
# path limit that breaks React Native's C++ build under a deep repository path.
#
#   powershell -File mobile\scripts\win-build.ps1 mobilitycare [assembleRelease|assembleDebug]
#
# What it does:
#   1. Creates a short junction C:\gm -> <repo>\mobile (no admin needed).
#   2. Runs `expo prebuild` if android/ is missing, then points AGP's C++ staging
#      directory at C:\gx\<app> so object-file paths stay well under 260 chars.
#   3. Applies conservative Gradle memory settings and builds with 2 workers.
#   4. Copies the APK to android-builds\GaitAI-<Name>-native-debug.apk
#      (release variant, JS bundled, signed with the debug key = installable
#      test build; not a Play release).
param(
  [Parameter(Mandatory = $true)][ValidateSet("mobilitycare", "securevision")][string]$App,
  [string]$Task = "assembleRelease"
)
$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Mobile = Join-Path $Repo "mobile"
$Label = @{ mobilitycare = "GaitAI-MobilityCare"; securevision = "GaitAI-SecureVision" }[$App]

$env:JAVA_HOME = if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) { $env:JAVA_HOME } else { "$env:USERPROFILE\.bubblewrap\jdk17" }
$env:ANDROID_HOME = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:CI = "1"
$env:NODE_OPTIONS = "--max-old-space-size=1536"

# 1. Short path.
if (-not (Test-Path "C:\gm")) { cmd /c mklink /J C:\gm "$Mobile" | Out-Null }
$AppDir = "C:\gm\apps\$App"
$Android = "$AppDir\android"

# 2. Native project.
if (-not (Test-Path "$Android\gradlew.bat")) { Push-Location $AppDir; npx expo prebuild --platform android --no-install; Pop-Location }
"sdk.dir=" + ($env:ANDROID_HOME -replace "\\", "\\") | Out-File "$Android\local.properties" -Encoding ascii
New-Item -ItemType Directory -Force "C:\gx\$App" | Out-Null
$gradle = Get-Content "$Android\app\build.gradle" -Raw
if ($gradle -notmatch "buildStagingDirectory") {
  $gradle += "`n// Windows: keep C++ intermediate paths short (MAX_PATH). Added by mobile/scripts/win-build.ps1.`nandroid { externalNativeBuild { cmake { buildStagingDirectory `"C:/gx/$App`" } } }`n"
  # Written without a BOM: Gradle rejects a build file that starts with one.
  [IO.File]::WriteAllText("$Android\app\build.gradle", $gradle, (New-Object System.Text.UTF8Encoding($false)))
}

# 3. Gradle settings.
$props = "$Android\gradle.properties"
$p = (Get-Content $props) | Where-Object { $_ -notmatch "^(org\.gradle\.(jvmargs|parallel|workers\.max|daemon)|kotlin\.(compiler\.execution\.strategy|daemon\.jvmargs)|reactNativeArchitectures)=" }
$p += @(
  "reactNativeArchitectures=arm64-v8a,x86_64",
  # 768m Metaspace: with the compiler in-process, 384m ended in "OutOfMemoryError: Metaspace"
  # when a prebuild invalidated every library module's Kotlin compile (2026-10-05).
  "org.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=768m -Dfile.encoding=UTF-8",
  "org.gradle.parallel=false", "org.gradle.workers.max=2", "org.gradle.daemon=false",
  # One JVM, not two: compile Kotlin inside the Gradle process with a small heap.
  "kotlin.compiler.execution.strategy=in-process", "kotlin.daemon.jvmargs=-Xmx512m")
Set-Content $props $p -Encoding ascii

# 4. Build.
# The JS bundle task only watches files under the app directory, so an edit to a
# shared package or to packages/analysis/engine/engine.html leaves it UP-TO-DATE
# and the previous bundle and assets are packaged again. Clear its outputs so the
# bundle and assets are always rebuilt from the current sources (about a minute).
Remove-Item -Recurse -Force "$Android\app\build\generated\assets\react", "$Android\app\build\generated\res\react" -ErrorAction SilentlyContinue
Push-Location $Android
# lintVital runs a second analysis pass over every module at release time and
# was the step that pushed this 15 GB machine into memory pressure; it is
# skipped for local test builds (Play builds run it in CI with more memory).
& .\gradlew.bat $Task --no-daemon --max-workers=2 -x lintVitalAnalyzeRelease -x lintVitalReportRelease -x lintVitalRelease
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { throw "Gradle failed with exit code $code" }

$variant = if ($Task -match "Debug") { "debug" } else { "release" }
$apk = Get-ChildItem "$Android\app\build\outputs\apk\$variant" -Filter *.apk | Select-Object -First 1
$suffix = if ($variant -eq "debug") { "native-devclient" } else { "native-debug" }
$dest = Join-Path $Repo "android-builds\$Label-$suffix.apk"
Copy-Item $apk.FullName $dest -Force
Write-Host "APK: $dest ($([math]::Round($apk.Length / 1MB, 1)) MB)"
