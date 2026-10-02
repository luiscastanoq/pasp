param(
    [switch]$SinE2E
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

function Invoke-NpmStep {
    param(
        [string]$Nombre,
        [string]$Directorio,
        [string[]]$Argumentos
    )

    Write-Host "`n==> $Nombre" -ForegroundColor Cyan
    Push-Location (Join-Path $raiz $Directorio)
    try {
        # npm.cmd evita el bloqueo habitual de npm.ps1 en Windows.
        & npm.cmd @Argumentos
        if ($LASTEXITCODE -ne 0) {
            throw "Falló '$Nombre' con código $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

Invoke-NpmStep 'Backend: lint' 'backend' @('run', 'lint')
Invoke-NpmStep 'Backend: compilación' 'backend' @('run', 'build')
Invoke-NpmStep 'Backend: tests' 'backend' @('test')
Invoke-NpmStep 'Frontend: lint' 'frontend' @('run', 'lint')
Invoke-NpmStep 'Frontend: compilación' 'frontend' @('run', 'build')
Invoke-NpmStep 'Frontend: tests' 'frontend' @('test')

if (-not $SinE2E) {
    Invoke-NpmStep 'Recorridos completos E2E' 'frontend' @('run', 'test:e2e')
}
else {
    Write-Host "`nE2E omitidos por -SinE2E." -ForegroundColor Yellow
}

Write-Host "`nVerificación completada correctamente." -ForegroundColor Green
