# 1. ECR Repository (Wahi rahega)
resource "aws_ecr_repository" "vinciflow" {
  name                 = "vinciflow-${var.env}-repo"
  force_delete         = true
  image_scanning_configuration { scan_on_push = true }
}

# 2. Build & Push (Tracks ALL files in src directory)
resource "terraform_data" "lambda_package" {
  input = sha256(join("", [
    for f in fileset("${path.module}/../../../src", "*") : filebase64sha256("${path.module}/../../../src/${f}")
  ]))

  provisioner "local-exec" {
    # 🚀 PowerShell compatible login command
    command     = "docker build --no-cache --platform linux/amd64 -t vinciflow-app -f '${path.module}/Dockerfile' '${path.module}/../../../..' ; cmd.exe /C \"aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 256364432182.dkr.ecr.ap-south-1.amazonaws.com\" ; powershell.exe -File '${path.module}/build_lambda.ps1' -repository_url ${aws_ecr_repository.vinciflow.repository_url}"
    interpreter = ["PowerShell", "-Command"]
  }
}

data "aws_ecr_image" "app_image" {
  repository_name = aws_ecr_repository.vinciflow.name
  image_tag       = "latest"
  depends_on      = [terraform_data.lambda_package]
}

# --- FUNCTIONS START HERE ---

# 3. API LAMBDA - Handles api_handler.py
resource "aws_lambda_function" "api_lambda" {
  function_name = "vinciflow-${var.env}-api"
  role          = var.iam_role_arn
  package_type  = "Image"
  timeout       = 29 #
  memory_size   = 256
  image_uri     = "${aws_ecr_repository.vinciflow.repository_url}@${data.aws_ecr_image.app_image.id}"

  image_config { command = ["api_handler.handler"] } # 🚀 Entrypoint override

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = var.dynamodb_table
      BRANDS_TABLE_NAME   = var.brands_table_name
      STATE_MACHINE_ARN   = var.state_machine_arn
    }
  }
}

# 4. PIPELINE LAMBDA - Handles pipeline_handler.py
resource "aws_lambda_function" "pipeline_lambda" {
  function_name = "vinciflow-${var.env}-pipeline"
  role          = var.iam_role_arn
  package_type  = "Image"
  timeout       = 300 #
  memory_size   = 512 #
  image_uri     = "${aws_ecr_repository.vinciflow.repository_url}@${data.aws_ecr_image.app_image.id}"

  image_config { command = ["pipeline_handler.handler"] } # 🚀 Entrypoint override

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = var.dynamodb_table
      BRANDS_TABLE_NAME   = var.brands_table_name
      GEMINI_API_KEY      = var.gemini_api_key
    }
  }
}

# 5. PUBLISH LAMBDA - Handles publish_handler.py
resource "aws_lambda_function" "publish_lambda" {
  function_name = "vinciflow-${var.env}-publish"
  role          = var.iam_role_arn
  package_type  = "Image"
  timeout       = 60
  image_uri     = "${aws_ecr_repository.vinciflow.repository_url}@${data.aws_ecr_image.app_image.id}"

  image_config { command = ["publish_handler.handler"] } # 🚀 Entrypoint override

  environment {
    variables = {
      BRANDS_TABLE_NAME = var.brands_table_name
      X_CLIENT_ID       = var.x_client_id
      X_CLIENT_SECRET   = var.x_client_secret
    }
  }
}