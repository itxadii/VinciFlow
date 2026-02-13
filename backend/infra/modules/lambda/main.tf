# backend/infra/modules/lambda/main.tf
# 1. Trigger the build script
resource "terraform_data" "lambda_build" {
  triggers_replace = {
    # Step out 3 levels: modules/lambda -> modules -> infra -> backend -> src
    handler_hash      = filebase64sha256("${path.module}/../../../src/handler.py")
    requirements_hash = filebase64sha256("${path.module}/../../../src/requirements.txt")
  }

  provisioner "local-exec" {
    command     = "powershell.exe -ExecutionPolicy Bypass -File ${path.module}/build_lambda.ps1"
    working_dir = path.module
  }
}

# 2. Archive the package (This waits for the build)
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/dist" 
  output_path = "${path.module}/index.zip"
  
  # Explicitly wait for the build resource to finish
  depends_on = [terraform_data.lambda_build]
}

resource "aws_lambda_function" "ai_agent" {
  # Use the dynamically generated path
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  function_name = "vinciflow-${var.env}-ai-agent"
  role          = var.iam_role_arn
  handler       = "handler.handler"
  runtime       = "python3.11"

  memory_size = 512 # Professional sizing for AI libraries
  timeout     = 60

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table
      GEMINI_API_KEY = var.gemini_api_key
    }
  }
}

# Permission for API Gateway to call this Lambda
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_agent.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:ap-south-1:${data.aws_caller_identity.current.account_id}:${var.api_gateway_id}/*/*"
}

data "aws_caller_identity" "current" {}