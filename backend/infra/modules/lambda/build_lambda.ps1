# build_lambda.ps1
if (Test-Path "./dist") { Remove-Item -Recurse -Force "./dist" }
New-Item -ItemType Directory -Path "./dist"

# Build Linux binaries via Docker
docker build -t vinciflow-builder .
docker create --name temp-container vinciflow-builder
docker cp temp-container:/var/task/dist/. ./dist
docker rm temp-container

Write-Host "Linux build extracted to ./dist" -ForegroundColor Green