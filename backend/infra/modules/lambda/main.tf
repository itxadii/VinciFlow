# 1. Define the Execution Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "vinciflow-${var.env}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# 2. Basic Execution Policy for CloudWatch Logging
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3. DynamoDB Access Policy
resource "aws_iam_role_policy" "dynamodb_access" {
  name = "vinciflow-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["dynamodb:PutItem", "dynamodb:Query", "dynamodb:GetItem"]
        Effect   = "Allow"
        Resource = var.dynamodb_table_arn
      }
    ]
  })
}

# 4. Consolidated Build & Zip Resource
# This ensures files exist before Terraform tries to read them.
resource "terraform_data" "lambda_package" {
  triggers_replace = {
    handler_hash      = filebase64sha256("${path.module}/../../../src/handler.py")
    requirements_hash = filebase64sha256("${path.module}/../../../src/requirements.txt")
  }

  # First provisioner: Runs Docker build via your script
  provisioner "local-exec" {
    command     = "powershell.exe -ExecutionPolicy Bypass -File ${path.module}/build_lambda.ps1"
    working_dir = path.module
  }

  # Second provisioner: Zips the dist folder AFTER build completes
  provisioner "local-exec" {
    command     = "powershell.exe -Command \"Compress-Archive -Path ./dist/* -DestinationPath ./index.zip -Force\""
    working_dir = path.module
  }
}

# 5. Upload to S3
# We use filebase64sha256 on the local file directly to force updates.
resource "aws_s3_object" "lambda_code" {
  bucket = var.deploy_bucket_id
  key    = "ai_agent/${filebase64sha256("${path.module}/index.zip")}.zip"
  source = "${path.module}/index.zip"

  # Crucial: Must wait for the zip to be created
  depends_on = [terraform_data.lambda_package]
}

# 6. Create the Lambda Function
resource "aws_lambda_function" "ai_agent" {
  function_name = "vinciflow-${var.env}-ai-agent"
  role          = aws_iam_role.lambda_role.arn
  
  s3_bucket = aws_s3_object.lambda_code.bucket
  s3_key    = aws_s3_object.lambda_code.key

  source_code_hash = filebase64sha256("${path.module}/index.zip")
  handler          = "handler.handler"
  runtime          = "python3.12"
  
  memory_size = 512 
  timeout     = 60

  environment {
    variables = {
      GEMINI_API_KEY = var.gemini_api_key
      DYNAMODB_TABLE = var.dynamodb_table 
    }
  }

  depends_on = [terraform_data.lambda_package]
}

data "aws_caller_identity" "current" {}