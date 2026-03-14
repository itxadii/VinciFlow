# 1. ECR Repository
resource "aws_ecr_repository" "vinciflow" {
  name                 = "vinciflow-${var.env}-repo"
  force_delete         = true
  image_scanning_configuration { scan_on_push = true }
}

# 2. Build & Push (Strict Compatibility)
resource "terraform_data" "lambda_package" {
  input = sha256(join("", [
    for f in fileset("${path.module}/../../../src", "*") : filebase64sha256("${path.module}/../../../src/${f}")
  ]))

  provisioner "local-exec" {
    # 🚀 Clean build with no provenance/sbom metadata
    command     = "docker build --no-cache --provenance=false --sbom=false --platform linux/amd64 -t vinciflow-app -f '${path.module}/Dockerfile' '${path.module}/../../../..' ; cmd.exe /C \"aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 256364432182.dkr.ecr.ap-south-1.amazonaws.com\" ; powershell.exe -File '${path.module}/build_lambda.ps1' -repository_url ${aws_ecr_repository.vinciflow.repository_url}"
    interpreter = ["PowerShell", "-Command"]
  }
}

# 🚀 CRITICAL: Fetching the unique digest of the image we just pushed
data "aws_ecr_image" "app_image" {
  repository_name = aws_ecr_repository.vinciflow.name
  image_tag       = "latest"
  depends_on      = [terraform_data.lambda_package]
}

# --- FUNCTIONS START HERE ---

# 3. API LAMBDA
resource "aws_lambda_function" "api_lambda" {
  function_name = "vinciflow-${var.env}-api"
  role          = var.iam_role_arn
  package_type  = "Image"
  timeout       = 29
  memory_size   = 256

  # 🚀 FIX: Using @digest instead of :latest to force function update
  image_uri     = "${aws_ecr_repository.vinciflow.repository_url}@${data.aws_ecr_image.app_image.image_digest}"

  image_config { command = ["api_handler.handler"] }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME    = var.dynamodb_table
      BRANDS_TABLE_NAME      = var.brands_table_name
      STATE_MACHINE_ARN      = var.state_machine_arn
      ASSETS_BUCKET_NAME     = var.assets_bucket_name
      SCHEDULER_ROLE_ARN     = var.scheduler_role_arn
      PUBLISH_LAMBDA_ARN     = aws_lambda_function.publish_lambda.arn
      BEDROCK_AGENT_ID       = var.bedrock_agent_id
      BEDROCK_AGENT_ALIAS_ID = var.bedrock_agent_alias_id
    }
  }
}

# 4. PIPELINE LAMBDA
resource "aws_lambda_function" "pipeline_lambda" {
  function_name = "vinciflow-${var.env}-pipeline"
  role          = var.iam_role_arn
  package_type  = "Image"
  timeout       = 300
  memory_size   = 512

  # 🚀 FIX: Using @digest to force function update
  image_uri     = "${aws_ecr_repository.vinciflow.repository_url}@${data.aws_ecr_image.app_image.image_digest}"

  image_config { command = ["pipeline_handler.handler"] }

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = var.dynamodb_table
      BRANDS_TABLE_NAME   = var.brands_table_name
      GEMINI_API_KEY      = var.gemini_api_key
      ASSETS_BUCKET_NAME  = var.assets_bucket_name
    }
  }
}

# 5. PUBLISH LAMBDA
resource "aws_lambda_function" "publish_lambda" {
  function_name = "vinciflow-${var.env}-publish"
  role          = var.iam_role_arn
  package_type  = "Image"
  timeout       = 60

  # 🚀 FIX: Using @digest to force function update
  image_uri     = "${aws_ecr_repository.vinciflow.repository_url}@${data.aws_ecr_image.app_image.image_digest}"

  image_config { command = ["publish_handler.handler"] }

  environment {
    variables = {
      BRANDS_TABLE_NAME = var.brands_table_name
      TABLE_NAME        = var.dynamodb_table
      X_CLIENT_ID       = var.x_client_id
      X_CLIENT_SECRET   = var.x_client_secret
    }
  }
}