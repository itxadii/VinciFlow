# backend/infra/modules/api_gateway/main.tf

# THE MISSING PIECE: The base API Gateway resource
resource "aws_apigatewayv2_api" "main" {
  name          = "vinciflow-${var.env}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
  }
}

# backend/infra/modules/api_gateway/main.tf

resource "aws_apigatewayv2_integration" "lambda_handler" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  # Use the variable name we defined in variables.tf
  integration_uri    = var.lambda_function_invoke_arn 
  payload_format_version = "2.0"
}

# The Route you added earlier
resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
}

# The Stage (Required for HTTP APIs to be accessible)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}