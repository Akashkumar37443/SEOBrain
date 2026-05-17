# Check Git Repository for Unwanted Files
Write-Host "Checking Git Repository" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Check if in git repo
if (!(Test-Path ".git")) {
    Write-Host "Not a git repository!" -ForegroundColor Red
    exit 1
}

Write-Host "`nTracked files:" -ForegroundColor Yellow
$files = git ls-files
$badFiles = @()
$reviewFiles = @()

foreach ($file in $files) {
    # Check for build artifacts
    if ($file -match "bin/|obj/|node_modules/|dist/|.venv/|__pycache__/|.pyc|.vs/" -and $file -notmatch "\.gitignore") {
        Write-Host "  BAD: $file" -ForegroundColor Red
        $badFiles += $file
    }
    # Check for secrets/configs
    elseif ($file -match "\.env|appsettings\.Production|appsettings\.Development|\.secret|\.key|\.pem|password|connectionString") {
        Write-Host "  REVIEW: $file" -ForegroundColor Yellow
        $reviewFiles += $file
    }
}

$count = ($files | Measure-Object).Count
Write-Host "`nTotal files: $count" -ForegroundColor White

if ($badFiles.Count -gt 0) {
    Write-Host "`nPROBLEM: $($badFiles.Count) files should NOT be tracked!" -ForegroundColor Red
    Write-Host "Run these commands to fix:" -ForegroundColor Cyan
    Write-Host "  git rm -r --cached bin obj" -ForegroundColor White
    Write-Host "  git rm -r --cached .vs" -ForegroundColor White  
    Write-Host "  git commit -m 'Clean up build artifacts'" -ForegroundColor White
}

if ($reviewFiles.Count -gt 0) {
    Write-Host "`nWARNING: Review these files for secrets!" -ForegroundColor Yellow
}

Write-Host "`nGood to go when no BAD files shown above." -ForegroundColor Green
