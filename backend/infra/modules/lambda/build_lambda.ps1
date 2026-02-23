param ([string]$repository_url)
$ErrorActionPreference = 'Stop'

# 1. AUTHENTICATE WITH ECR
# Isse login token generate hota hai jo Docker client ko authorize karta hai
Write-Host "--- AUTHENTICATING WITH ECR ---" -ForegroundColor Yellow
cmd.exe /C "aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 256364432182.dkr.ecr.ap-south-1.amazonaws.com"

# 2. TAGGING & PUSHING
Write-Host "--- TAGGING & PUSHING TO ECR ---" -ForegroundColor Cyan
docker tag vinciflow-ai-agent:latest "${repository_url}:latest"
docker push "${repository_url}:latest"

if ($LASTEXITCODE -ne 0) { throw "Push Failed!" }

# 3. INDEXING WAIT
# AWS ko image metadata sync karne ke liye thoda time dena zaroori hai
Write-Host "Waiting 20 seconds for AWS indexing..."
Start-Sleep -Seconds 20