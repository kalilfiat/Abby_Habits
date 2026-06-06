# Builds a release APK and copies it to dist/ (Windows).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:GRADLE_USER_HOME = "C:\gradle"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null
New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null

if (-not (Test-Path "$root\android\gradlew.bat")) {
  Write-Host "Generando proyecto nativo (expo prebuild --clean)..."
  Push-Location $root
  npx expo prebuild --platform android --clean --no-install
  Pop-Location
}

# Gradle 9 + RN: ensure foojay resolver is 1.0.0 (IBM_SEMERU fix).
$gradleSettings = "$root\node_modules\@react-native\gradle-plugin\settings.gradle.kts"
if (Test-Path $gradleSettings) {
  (Get-Content $gradleSettings -Raw) -replace 'foojay-resolver-convention"\)\.version\("0\.5\.0"\)', 'foojay-resolver-convention").version("1.0.0")' | Set-Content $gradleSettings -NoNewline
}

Push-Location "$root\android"
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon
Pop-Location

$version = (Get-Content "$root\package.json" | ConvertFrom-Json).version
$src = "$root\android\app\build\outputs\apk\release\app-release.apk"
$dest = "$root\dist\abby-habits-$version.apk"
Copy-Item $src $dest -Force
Write-Host ""
Write-Host "APK listo: $dest"
