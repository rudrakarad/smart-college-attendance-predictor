# Auto Push Script for Smart College Attendance Predictor
Param(
    [string]$CommitMessage = "Auto update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Set-Location -Path $PSScriptRoot

Write-Host "=== Git Auto Push Started ===" -ForegroundColor Cyan

# Check git status
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes detected to commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "Staging files..." -ForegroundColor Green
git add .

Write-Host "Committing changes with message: '$CommitMessage'..." -ForegroundColor Green
git commit -m "$CommitMessage"

Write-Host "Pushing to remote git web repository..." -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== Auto Push Successfully Completed! ===" -ForegroundColor Green
} else {
    Write-Host "Push failed. Please verify git web authentication / permissions for origin remote." -ForegroundColor Red
}
