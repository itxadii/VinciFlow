# 1. IAM Role & Permissions
resource "aws_iam_role" "lambda_role" {
  name = "vinciflow-${var.env}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "vinciflow-dynamodb-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["dynamodb:PutItem", "dynamodb:Query", "dynamodb:GetItem"]
      Effect   = "Allow"
      Resource = var.dynamodb_table_arn
    }]
  })
}

# 2. ECR Repository: This replaces S3 for storage
resource "aws_ecr_repository" "ai_agent" {
  name                 = "vinciflow-${var.env}-ai-agent"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # Helpful during dev to clean up images

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 3. Build & Push Sequence
# backend/infra/modules/lambda/main.tf

resource "terraform_data" "lambda_package" {
  # Force trigger: Jab bhi handler.py ya requirements.txt badlega, ye trigger hoga
  input = sha256(join("", [
    filebase64sha256("${path.module}/../../../src/handler.py"),
    filebase64sha256("${path.module}/../../../src/requirements.txt")
  ]))

  provisioner "local-exec" {
    # --no-cache is mandatory here to kill that 404 ghost
    command     = "docker build --no-cache --provenance=false --platform linux/amd64 -t vinciflow-ai-agent -f '${path.module}/Dockerfile' '${path.module}/../../../..' ; if ($LASTEXITCODE -eq 0) { powershell.exe -ExecutionPolicy Bypass -File '${path.module}/build_lambda.ps1' -repository_url ${aws_ecr_repository.ai_agent.repository_url} }"
    interpreter = ["PowerShell", "-Command"]
  }
}

# 2. THE FUNCTION
resource "aws_lambda_function" "ai_agent" {
  function_name = "vinciflow-dev-ai-agent"
  role          = aws_iam_role.lambda_role.arn
  package_type  = "Image"
  timeout       = 30
  memory_size   = 512
  
  # THE FIX: Point to the image
  image_uri     = "${aws_ecr_repository.ai_agent.repository_url}:latest"

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table
      GEMINI_API_KEY = var.gemini_api_key
      # FORCE REDEPLOY: This hash changes whenever your code changes
      CODE_VERSION   = terraform_data.lambda_package.output
    }
  }

  # Ensure the image is pushed BEFORE the function tries to update
  depends_on = [terraform_data.lambda_package]
}

data "aws_caller_identity" "current" {}