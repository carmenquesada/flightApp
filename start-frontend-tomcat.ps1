param(
    [string]$TomcatHome = $env:CATALINA_HOME,
    [bool]$OpenBrowser = $true,
    [bool]$RemoveDefaultTomcatApps = $true
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePublicDir = Join-Path $projectRoot "frontend\public"
$sourceAssets = Join-Path $projectRoot "frontend\assets"
$frontendRoute = "http://localhost:8080/login.html"
$cacheBuster = [DateTimeOffset]::Now.ToUnixTimeSeconds()

if (-not (Test-Path $sourcePublicDir)) {
    throw "No se encontro la carpeta public en: $sourcePublicDir"
}

if (-not (Test-Path $sourceAssets)) {
    throw "No se encontro la carpeta de assets en: $sourceAssets"
}

if (-not [string]::IsNullOrWhiteSpace($TomcatHome) -and -not [System.IO.Path]::IsPathRooted($TomcatHome)) {
    $TomcatHome = Join-Path $projectRoot $TomcatHome
}

if ([string]::IsNullOrWhiteSpace($TomcatHome)) {
    throw "Define TOMCAT_HOME o CATALINA_HOME y vuelve a ejecutar el script."
}

$TomcatHome = [System.IO.Path]::GetFullPath($TomcatHome)

$startupBat = Join-Path $TomcatHome "bin\startup.bat"
if (-not (Test-Path $startupBat)) {
    throw "No se encontro startup.bat en: $startupBat"
}

if ($RemoveDefaultTomcatApps) {
    $defaultApps = @("ROOT", "docs", "examples", "host-manager", "manager")
    foreach ($app in $defaultApps) {
        $appPath = Join-Path (Join-Path $TomcatHome "webapps") $app
        if (Test-Path $appPath) {
            Remove-Item -Path $appPath -Recurse -Force
        }
    }
}

$rootWebApp = Join-Path $TomcatHome "webapps\ROOT"
if (-not (Test-Path $rootWebApp)) {
    New-Item -ItemType Directory -Path $rootWebApp | Out-Null
}

# Elimina paginas legacy para evitar que Tomcat sirva una version antigua.
$legacyPages = @(
        "index.html",
    "login.html",
        "busquedaVuelos.html",
        "busquedasVuelos.html"
)

foreach ($page in $legacyPages) {
        $pagePath = Join-Path $rootWebApp $page
        if (Test-Path $pagePath) {
                Remove-Item -Path $pagePath -Force
        }
}

# Publica todas las paginas del frontend.
Get-ChildItem -Path $sourcePublicDir -Filter "*.html" -File | ForEach-Object {
    $destinationPath = Join-Path $rootWebApp $_.Name
    Copy-Item -Path $_.FullName -Destination $destinationPath -Force

    # Fuerza recarga de CSS/JS tras cada despliegue para evitar cache stale del navegador.
    $html = Get-Content -Path $destinationPath -Raw
    $assetPattern = '(?<attr>(?:href|src)="/assets/[^"?]+)(?:\?[^\"]*)?(?<end>")'
    $assetReplacement = '${attr}?v=' + $cacheBuster + '${end}'
    $html = [regex]::Replace($html, $assetPattern, $assetReplacement)
    Set-Content -Path $destinationPath -Value $html -Encoding UTF8
}

# Alias legacy para mantener compatibilidad con URLs antiguas.
$searchPagePath = Join-Path $rootWebApp "busquedaVuelos.html"
if (Test-Path $searchPagePath) {
    Copy-Item -Path $searchPagePath -Destination (Join-Path $rootWebApp "busquedasVuelos.html") -Force
}

# Publica recursos estaticos (CSS/JS/imagenes) para que el frontend funcione.
$rootAssets = Join-Path $rootWebApp "assets"
if (Test-Path $rootAssets) {
    Remove-Item -Path $rootAssets -Recurse -Force
}

Copy-Item -Path $sourceAssets -Destination $rootAssets -Recurse -Force

# / redirige siempre a la pagina correcta.
$indexContent = @"
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=/login.html">
    <title>FlyNow</title>
</head>
<body>
    <script>
        window.location.replace('/login.html');
    </script>
</body>
</html>
"@

Set-Content -Path (Join-Path $rootWebApp "index.html") -Value $indexContent -Encoding UTF8

$env:CATALINA_HOME = $TomcatHome
if ([string]::IsNullOrWhiteSpace($env:CATALINA_BASE)) {
    $env:CATALINA_BASE = $TomcatHome
}

Start-Process -FilePath $startupBat -WorkingDirectory (Join-Path $TomcatHome "bin") | Out-Null
Start-Sleep -Seconds 3

$frontendOk = $false
try {
    $resp = Invoke-WebRequest -Uri $frontendRoute -UseBasicParsing -TimeoutSec 5
    if ($resp.Content -match "FlyNow \| Login") {
        $frontendOk = $true
    }
} catch {
    $frontendOk = $false
}

if ($OpenBrowser) {
    try {
        [System.Diagnostics.Process]::Start("$frontendRoute`?v=$cacheBuster")
    } catch {
        Write-Host "No se pudo abrir el navegador. Accede manualmente a: $frontendRoute"
    }
}

if ($frontendOk) {
    Write-Host "Frontend desplegado en Tomcat: $frontendRoute"
} else {
    Write-Warning "No se pudo verificar la pagina en $frontendRoute. Revisa si el puerto 8080 esta ocupado por otro servicio."
}

Write-Host "Para detener Tomcat: $TomcatHome\bin\shutdown.bat"
if ($RemoveDefaultTomcatApps) {
    Write-Host "Apps por defecto eliminadas de Tomcat: ROOT/docs/examples/host-manager/manager"
}
