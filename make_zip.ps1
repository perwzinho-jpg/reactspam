$source = "c:\Users\Elias\Desktop\arquivos\reactspam\backend"
$dest = "c:\Users\Elias\Desktop\arquivos\reactspam\backend_clean.zip"

Add-Type -Assembly "System.IO.Compression.FileSystem"

if (Test-Path $dest) { Remove-Item $dest }

$zip = [System.IO.Compression.ZipFile]::Open($dest, "Create")

Get-ChildItem -Path $source -Recurse | Where-Object {
    $_.FullName -notmatch "node_modules"
} | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $entryName = $_.FullName.Substring($source.Length + 1)
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName)
    }
}

$zip.Dispose()
Write-Host "ZIP criado em: $dest"
