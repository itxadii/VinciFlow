# 1. ECR Repository for the AI Agent Image
resource "aws_ecr_repository" "ai_agent" {
  name                 = "vinciflow-${var.env}-ai-agent"
  image_tag_mutability = "MUTABLE"
  force_delete         = true 

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 2. Build & Push Sequence (Using Docker for Multimodal/Heavy Dependencies)
resource "terraform_data" "lambda_package" {
  input = sha256(join("", [
    filebase64sha256("${path.module}/../../../src/handler.py"),
    filebase64sha256("${path.module}/../../../src/requirements.txt")
  ]))

  provisioner "local-exec" {
    command     = "docker build --no-cache --provenance=false --platform linux/amd64 -t vinciflow-ai-agent -f '${path.module}/Dockerfile' '${path.module}/../../../..' ; if ($LASTEXITCODE -eq 0) { powershell.exe -ExecutionPolicy Bypass -File '${path.module}/build_lambda.ps1' -repository_url ${aws_ecr_repository.ai_agent.repository_url} }"
    interpreter = ["PowerShell", "-Command"]
  }
}

# 3. Data Source for ECR Image Digest
data "aws_ecr_image" "lambda_image" {
  repository_name = aws_ecr_repository.ai_agent.name
  image_tag        = "latest"
  depends_on      = [terraform_data.lambda_package]
}

# 4. THE AI AGENT FUNCTION
resource "aws_lambda_function" "ai_agent" {
  function_name = "vinciflow-${var.env}-ai-agent"
  role          = var.iam_role_arn
  package_type  = "Image"
  timeout       = 30
  memory_size   = 512
  
  image_uri = "${aws_ecr_repository.ai_agent.repository_url}@${data.aws_ecr_image.lambda_image.id}"

  environment {
    variables = {
      # Database Config
      DYNAMODB_TABLE_NAME    = var.dynamodb_table 
      BRANDS_TABLE_NAME      = var.brands_table_name
      SCHEDULER_ROLE_ARN     = var.scheduler_role_arn
      ASSETS_BUCKET_NAME     = var.assets_bucket_name

      # Bedrock (Intelligence Plane)
      BEDROCK_AGENT_ID       = "Y65UM8CFJP"
      BEDROCK_AGENT_ALIAS_ID = "TSTALIASID"
      
      # External APIs
      GEMINI_API_KEY         = var.gemini_api_key
      X_CLIENT_ID            = var.x_client_id
      X_CLIENT_SECRET        = var.x_client_secret
      
      # Deployment tracking
      CODE_VERSION           = terraform_data.lambda_package.output
    }
  }

  depends_on = [terraform_data.lambda_package]
}