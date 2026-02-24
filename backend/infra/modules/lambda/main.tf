# backend/infra/modules/lambda/main.tf

# 1. IAM Role for Lambda
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

# 2. Basic Execution Role (Logs)
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3. COMPREHENSIVE POLICY: Bedrock + DynamoDB
# 3. COMPREHENSIVE POLICY: Bedrock + DynamoDB (Memory & Brands)
resource "aws_iam_role_policy" "vinciflow_access_policy" {
  name = "vinciflow-${var.env}-access-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = [
          "bedrock:InvokeAgent",
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:bedrock:ap-south-1:256364432182:agent/Y65UM8CFJP",
          "arn:aws:bedrock:ap-south-1:256364432182:agent-alias/Y65UM8CFJP/*",
          "arn:aws:bedrock:us-east-1:256364432182:inference-profile/us.amazon.nova-lite-v1:0",
          "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0" 
        ]
      },
      # DynamoDB Access (Memory AND Brands)
      {
        Action   = ["dynamodb:PutItem", "dynamodb:Query", "dynamodb:GetItem", "dynamodb:UpdateItem"]
        Effect   = "Allow"
        Resource = [
          var.dynamodb_table_arn,
          var.brands_table_arn
        ]
      }
    ]
  })
}

# 4. ECR Repository
resource "aws_ecr_repository" "ai_agent" {
  name                 = "vinciflow-${var.env}-ai-agent"
  image_tag_mutability = "MUTABLE"
  force_delete         = true 

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 5. Build & Push Sequence
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

# 6. Data Source for ECR Image Digest (Force Deployment Fix)
data "aws_ecr_image" "lambda_image" {
  repository_name = aws_ecr_repository.ai_agent.name
  image_tag       = "latest"
  depends_on      = [terraform_data.lambda_package]
}

# 7. THE FUNCTION
# 7. THE FUNCTION
resource "aws_lambda_function" "ai_agent" {
  function_name = "vinciflow-dev-ai-agent"
  role          = aws_iam_role.lambda_role.arn
  package_type  = "Image"
  timeout       = 30
  memory_size   = 512
  
  image_uri = "${aws_ecr_repository.ai_agent.repository_url}@${data.aws_ecr_image.lambda_image.id}"

  environment {
    variables = {
      DYNAMODB_TABLE_NAME    = var.dynamodb_table 
      # NEW: Environment variable for Brand Onboarding logic
      BRANDS_TABLE_NAME      = var.brands_table_name 
      BEDROCK_AGENT_ID       = "Y65UM8CFJP"
      BEDROCK_AGENT_ALIAS_ID = "TSTALIASID"
      GEMINI_API_KEY         = var.gemini_api_key
      CODE_VERSION           = terraform_data.lambda_package.output
    }
  }

  depends_on = [terraform_data.lambda_package]
}

data "aws_caller_identity" "current" {}