param ([string]$repository_url)
$ErrorActionPreference = 'Stop'

Write-Host "--- TAGGING & PUSHING TO ECR ---" -ForegroundColor Cyan
docker tag vinciflow-ai-agent:latest "${repository_url}:latest"
docker push "${repository_url}:latest"

if ($LASTEXITCODE -ne 0) { throw "Push Failed!" }

Write-Host "Waiting 20 seconds for AWS indexing..."
Start-Sleep -Seconds 20