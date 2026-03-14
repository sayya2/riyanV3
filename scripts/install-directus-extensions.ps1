param(
  [string]$ExtensionsPath = (Resolve-Path "directus/extensions"),
  [string[]]$Packages = @(
    "@directus-labs/ai-image-generation-operation",
    "@directus-labs/experimental-m2a-interface",
    "@directus-labs/super-header-interface",
    "@directus-labs/inline-repeater-interface",
    "@directus-labs/seo-plugin",
    "directus-extension-wpslug-interface",
    "@directus-labs/ai-writer-operation",
    "@directus-labs/liquidjs-operation",
    "@directus-labs/card-select-interfaces",
    "@directus-labs/simple-list-interface",
    "@directus-labs/command-palette-module",
    "directus-extension-group-tabs-interface"
  )
)

$ErrorActionPreference = "Stop"

$typeFolders = @{
  interface = "interfaces"
  display   = "displays"
  layout    = "layouts"
  module    = "modules"
  hook      = "hooks"
  operation = "operations"
  endpoint  = "endpoints"
  bundle    = "bundles"
}

$tempRoot = Join-Path $env:TEMP ("directus-ext-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
  foreach ($package in $Packages) {
    $packageRoot = Join-Path $tempRoot ([guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $packageRoot | Out-Null

    Push-Location $packageRoot
    try {
      $null = npm pack $package
    } finally {
      Pop-Location
    }

    $tgz = Get-ChildItem -Path $packageRoot -Filter "*.tgz" |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if (-not $tgz) {
      throw "Failed to download package: $package"
    }

    $extractRoot = Join-Path $packageRoot "extract"
    New-Item -ItemType Directory -Path $extractRoot | Out-Null
    tar -xzf $tgz.FullName -C $extractRoot

    $packageDir = Join-Path $extractRoot "package"
    $manifestPath = Join-Path $packageDir "package.json"
    if (-not (Test-Path $manifestPath)) {
      throw "Missing package.json for $package"
    }

    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $extension = $manifest.'directus:extension'
    if (-not $extension) {
      throw "Missing directus:extension metadata in $package"
    }

    $extensionType = $extension.type
    if (-not $extensionType) {
      throw "Missing directus:extension.type in $package"
    }

    $typeFolder = $typeFolders[$extensionType]
    if (-not $typeFolder) {
      throw "Unsupported extension type '$extensionType' in $package"
    }

    $packageName = $manifest.name
    if (-not $packageName) {
      throw "Missing package name for $package"
    }

    $folderName = ($packageName -split "/")[-1]
    $destDir = Join-Path -Path $ExtensionsPath -ChildPath $folderName

    if (Test-Path $destDir) {
      Remove-Item -Recurse -Force $destDir
    }
    New-Item -ItemType Directory -Path (Split-Path $destDir -Parent) -Force | Out-Null
    Move-Item -Path $packageDir -Destination $destDir

    if (-not (Test-Path (Join-Path $destDir "dist"))) {
      Write-Warning "No dist/ folder found for $package at $destDir"
    }
  }
} finally {
  Remove-Item -Recurse -Force $tempRoot
}

Write-Host "Directus extensions installed to $ExtensionsPath"
