resource "aws_iam_role_policy" "dynamodb_access" {
  name = "vinciflow-${var.env}-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:UpdateItem"]
      Effect   = "Allow"
      # FIX: Added both ARNs to the resource list
      Resource = [
        var.dynamodb_table_arn, 
        var.brands_table_arn
      ] 
    }]
  })
}

# --- 1. LAMBDA EXECUTION ROLE ---
resource "aws_iam_role" "lambda_exec" {
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

# Basic Logging permissions
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_access_policy" {
  name       = "vinciflow-${var.env}-lambda-access-policy"
  role       = aws_iam_role.lambda_exec.id
  depends_on = [aws_iam_role.lambda_exec]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Bedrock Interaction
        Action = [
          "bedrock:InvokeAgent",
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:bedrock:ap-south-1:256364432182:agent/Y65UM8CFJP",
          "arn:aws:bedrock:ap-south-1:256364432182:agent-alias/Y65UM8CFJP/*",
          "arn:aws:bedrock:us-east-1:256364432182:inference-profile/us.amazon.nova-lite-v1:0",
          "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"
        ]
      },
      {
        # DynamoDB Access (Memory AND Brands)
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Effect = "Allow"
        Resource = [
          var.dynamodb_table_arn,
          var.brands_table_arn
        ]
      },
      {
        # Step Functions Trigger
        Action   = "states:StartExecution"
        Effect   = "Allow"
        Resource = var.state_machine_arn
      },
      {
        # SSM Parameter Store
        Action   = "ssm:GetParameter"
        Effect   = "Allow"
        Resource = "arn:aws:ssm:ap-south-1:256364432182:parameter/vinciflow/${var.env}/state_machine_arn"
      }
      # REMOVED KMS STATEMENT
    ]
  })
}

# --- 2. BEDROCK AGENT PERMISSIONS ---
# Since you have a separate Bedrock Agent ID, it needs permission 
# to trigger the Step Function if it acts as a direct planner.
resource "aws_iam_role_policy" "bedrock_sfn_execution" {
  name = "vinciflow-${var.env}-bedrock-sfn-policy"
  # Use the ARN or Name passed from the variable
  role = element(split("/", var.agent_role_arn), length(split("/", var.agent_role_arn)) - 1)

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = "states:StartExecution"
      Effect   = "Allow"
      Resource = var.state_machine_arn
    }]
  })
}