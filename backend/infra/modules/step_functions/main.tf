# IAM Role for Step Function Execution
resource "aws_iam_role" "sfn_exec" {
  name = "vinciflow-${var.env}-sfn-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "states.amazonaws.com" }
    }]
  })
}

# Permission to invoke the specific Lambdas defined in your dev/main.tf
resource "aws_iam_role_policy" "sfn_lambda_invoke" {
  name = "vinciflow-${var.env}-sfn-lambda-policy"
  role = aws_iam_role.sfn_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "lambda:InvokeFunction"
      Effect = "Allow"
      Resource = [
        var.lambda_intent_parser_arn,
        var.lambda_generator_arn,
        var.lambda_branding_arn,
        var.lambda_storage_arn
      ]
    }]
  })
}

# The State Machine Deployment
resource "aws_sfn_state_machine" "content_pipeline" {
  name     = "vinciflow-${var.env}-content-pipeline"
  role_arn = aws_iam_role.sfn_exec.arn

  definition = templatefile("${path.module}/definition.json", {
    # Change the keys on the left side to match your JSON
    arn_lambda_intent_parser = var.lambda_intent_parser_arn
    arn_lambda_generator     = var.lambda_generator_arn
    arn_lambda_branding      = var.lambda_branding_arn
    arn_lambda_storage       = var.lambda_storage_arn
  })
}