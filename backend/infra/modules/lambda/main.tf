# 1. Trigger the build script when code changes
resource "terraform_data" "lambda_build" {
  triggers_replace = {
    handler_hash      = filebase64sha256("${path.module}/../../../src/handler.py")
    requirements_hash = filebase64sha256("${path.module}/../../../src/requirements.txt")
  }

  provisioner "local-exec" {
    command     = "powershell.exe -ExecutionPolicy Bypass -File ${path.module}/build_lambda.ps1"
    working_dir = path.module
  }
}

# 2. Archive the package (waits for the build script to finish)
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/dist" 
  output_path = "${path.module}/index.zip"
  
  depends_on = [terraform_data.lambda_build]
}

# 3. Upload the heavy zip (70MB) to S3 first
resource "aws_s3_object" "lambda_code" {
  bucket = var.deploy_bucket_id
  key    = "ai_agent/${data.archive_file.lambda_zip.output_base64sha256}.zip"
  source = data.archive_file.lambda_zip.output_path
}

# 4. Create the Lambda Function using the S3 reference
resource "aws_lambda_function" "ai_agent" {
  function_name = "vinciflow-${var.env}-ai-agent"
  role          = var.iam_role_arn
  
  # Point to S3 instead of local filename to bypass the 50MB limit
  s3_bucket = aws_s3_object.lambda_code.bucket
  s3_key    = aws_s3_object.lambda_code.key

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  handler          = "handler.handler"
  runtime          = "python3.12"
  
  memory_size = 512 
  timeout     = 60

  environment {
    variables = {
      GEMINI_API_KEY = var.gemini_api_key
      DYNAMODB_TABLE = var.dynamodb_table # Ensure variable name matches your vars.tf
    }
  }
}
data "aws_caller_identity" "current" {}