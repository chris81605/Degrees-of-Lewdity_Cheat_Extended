Add-Type -AssemblyName System.IO.Compression

$sourceDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($sourceDir)) {
    $sourceDir = Get-Location
}
$parentDir = Split-Path -Path $sourceDir -Parent
$zipPath = Join-Path -Path $parentDir -ChildPath "cheat_extended.mod.zip"

Write-Host "Packaging from: $sourceDir"
Write-Host "Output ZIP: $zipPath"

if (Test-Path $zipPath) { 
    Remove-Item $zipPath -Force 
}

$stream = New-Object System.IO.FileStream($zipPath, [System.IO.FileMode]::Create)
$zip = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $sourceDir -Recurse | Where-Object { !$_.PSIsContainer } | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1).Replace("\", "/")
    
    # Skip packing scripts and git files
    if ($relativePath -eq "pack.ps1" -or $relativePath -eq "pack.sh" -or $relativePath.StartsWith(".git/") -or $relativePath -eq ".git") {
        return
    }
    
    $entry = $zip.CreateEntry($relativePath)
    $entryStream = $entry.Open()
    $fileStream = New-Object System.IO.FileStream($_.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read)
    $fileStream.CopyTo($entryStream)
    $fileStream.Close()
    $entryStream.Close()
}

$zip.Dispose()
$stream.Close()

Write-Host "ZIP packaging completed successfully with forward slashes!"
