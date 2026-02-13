# backend/infra/modules/lambda/build_lambda.ps1

# 1. Clean up old builds
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "index.zip") { Remove-Item "index.zip" }

# 2. Create dist folder and install dependencies
New-Item -ItemType Directory -Path "dist"
pip install -r "../../../src/requirements.txt" -t "dist"

# 3. Copy your Python handler code
Copy-Item "../../../src/handler.py" "dist/"

# 4. Zip the contents of the dist folder
# Using native .NET compression available in PowerShell 5.1+
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("$PWD/dist", "$PWD/index.zip")