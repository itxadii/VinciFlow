# modules/bedrock_agent/main.tf

# 1. IAM Role for the Agent
resource "aws_iam_role" "agent_role" {
  name = "vinciflow-agent-role-dev"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { 
        Service = "bedrock.amazonaws.com" # <--- Ensure this is correct
      }
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = var.account_id
        }
      }
    }]
  })
}

# backend/infra/modules/bedrock_agent/main.tf

resource "aws_iam_role_policy" "agent_policy" {
  role = aws_iam_role.agent_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "bedrock:InvokeModel"
        Effect   = "Allow"
        # THE ATOMIC FIX: Dono resources ko allow karna mandatory hai
        Resource = [
          "arn:aws:bedrock:ap-south-1::foundation-model/amazon.nova-lite-v1:0",
          "arn:aws:bedrock:ap-south-1:${var.account_id}:inference-profile/us.amazon.nova-lite-v1:0"
        ]
      },
      {
        Action   = "lambda:InvokeFunction"
        Effect   = "Allow"
        Resource = var.lambda_function_arn
      }
    ]
  })
}

resource "aws_bedrockagent_agent" "this" {
  agent_name                  = "VinciFlow-Manager-${var.env}"
  agent_resource_role_arn     = aws_iam_role.agent_role.arn

  # THE FINAL FIX: Full ARN use karo short ID ki jagah
  foundation_model = "apac.amazon.nova-lite-v1:0"

  instruction                 = var.agent_instruction

  memory_configuration {
    enabled_memory_types = ["SESSION_SUMMARY"]
    storage_days         = 30
  }
  depends_on = [time_sleep.wait_30_seconds]
}

# 4. Critical Resource-Based Policy for Lambda
resource "aws_lambda_permission" "allow_bedrock" {
  statement_id  = "AllowBedrockAgentInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "bedrock.amazonaws.com"
  source_arn    = "arn:aws:bedrock:ap-south-1:${var.account_id}:agent/*"
}

resource "time_sleep" "wait_30_seconds" {
  depends_on = [aws_iam_role_policy.bedrock_inference_profile]
  create_duration = "30s"
}

resource "aws_iam_role_policy" "bedrock_inference_profile" {
  name = "AmazonBedrockAgentInferenceProfilesCrossRegionPolicy_YZAFQGE48JI"
  role = aws_iam_role.agent_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "InferenceProfilePermissions"
        Effect   = "Allow"
        Action   = [
          "bedrock:GetInferenceProfile",
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:ap-south-1:${var.account_id}:inference-profile/us.amazon.nova-lite-v1:0"
        ]
      },
      {
        Sid      = "FoundationModelPermissions"
        Effect   = "Allow"
        Action   = [
          "bedrock:GetFoundationModel",
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:ap-south-1::foundation-model/amazon.nova-lite-v1:0"
        ]
      }
    ]
  })
}