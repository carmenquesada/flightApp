param(
    [string]$TomcatHome = $env:CATALINA_HOME,
    [bool]$OpenBrowser = $true,
    [bool]$RemoveDefaultTomcatApps = $true
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceHtml = Join-Path $projectRoot "frontend\public\busquedaVuelos.html"
$frontendRoute = "http://localhost:8080/busquedaVuelos.html"

if (-not (Test-Path $sourceHtml)) {
    throw "No se encontro el HTML en: $sourceHtml"
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
        "busquedaVuelos.html",
        "busquedasVuelos.html"
)

foreach ($page in $legacyPages) {
        $pagePath = Join-Path $rootWebApp $page
        if (Test-Path $pagePath) {
                Remove-Item -Path $pagePath -Force
        }
}

# Publica la pagina real en singular y crea alias en plural por compatibilidad.
Copy-Item -Path $sourceHtml -Destination (Join-Path $rootWebApp "busquedaVuelos.html") -Force
Copy-Item -Path $sourceHtml -Destination (Join-Path $rootWebApp "busquedasVuelos.html") -Force

# / redirige siempre a la pagina correcta.
$indexContent = @"
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=/busquedaVuelos.html">
    <title>FlyNow</title>
</head>
<body>
    <script>
        window.location.replace('/busquedaVuelos.html');
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
    if ($resp.Content -match "Buscador simple de vuelos - FlyNow") {
        $frontendOk = $true
    }
} catch {
    $frontendOk = $false
}

if ($OpenBrowser) {
    $cacheBuster = [DateTimeOffset]::Now.ToUnixTimeSeconds()
    Start-Process "$frontendRoute?v=$cacheBuster"
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
