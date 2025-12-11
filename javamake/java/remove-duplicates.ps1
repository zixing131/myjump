# PowerShell script to remove duplicate Java files
# Keeps only the first occurrence of each class (by package path)
# Priority: midp > custom > freej2me > cldc1.1.1 > others

param(
    [string]$BuildSrcDir = "build-src"
)

Write-Host "Removing duplicate Java files..."

$buildSrcPath = (Resolve-Path $BuildSrcDir).Path

# Priority order for directories (higher priority first)
$priority = @{
    "midp" = 1
    "custom" = 2
    "freej2me" = 3
    "cldc1.1.1" = 4
}

# Get all Java files with their relative paths
$allFiles = Get-ChildItem -Path $BuildSrcDir -Recurse -Filter "*.java" | ForEach-Object {
    $fullPath = $_.FullName
    $relPath = $fullPath.Replace($buildSrcPath + '\', '').Replace('\', '/')
    $dirName = $relPath.Split('/')[0]
    $packagePath = $relPath -replace '^[^/]+/', ''  # Remove directory prefix, keep package path
    
    [PSCustomObject]@{
        FullPath = $fullPath
        RelPath = $relPath
        PackagePath = $packagePath
        DirName = $dirName
        Priority = if ($priority.ContainsKey($dirName)) { $priority[$dirName] } else { 999 }
    }
}

# Group by package path and keep only the highest priority one
$keep = @{}
$toRemove = @()

foreach ($file in $allFiles) {
    if (-not $keep.ContainsKey($file.PackagePath)) {
        # First occurrence, keep it
        $keep[$file.PackagePath] = $file
    } else {
        # Compare priority
        $existing = $keep[$file.PackagePath]
        if ($file.Priority -lt $existing.Priority) {
            # Current file has higher priority, remove existing and keep current
            $toRemove += $existing.FullPath
            $keep[$file.PackagePath] = $file
        } else {
            # Existing has higher or equal priority, remove current
            $toRemove += $file.FullPath
        }
    }
}

# Remove duplicate files
foreach ($file in $toRemove) {
    Write-Host "Removing duplicate: $file"
    Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
}

Write-Host "Removed $($toRemove.Count) duplicate files. Kept $($keep.Count) unique files."

