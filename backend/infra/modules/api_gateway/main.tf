# backend/infra/modules/api_gateway/main.tf

resource "aws_apigatewayv2_api" "main" {
  name          = "vinciflow-${var.env}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "http://localhost:5173",
      "https://dev.d8aheoykcvs8k.amplifyapp.com",
      "https://main.d8aheoykcvs8k.amplifyapp.com"
    ]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 300
  }
}

# The JWT Authorizer (Built-in for HTTP APIs)
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "vinciflow-auth"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = "https://cognito-idp.ap-south-1.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# The Integration with your Lambda
resource "aws_apigatewayv2_integration" "lambda_handler" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.lambda_function_invoke_arn
  payload_format_version = "2.0"
}

# Specific Route for the AI Agent
resource "aws_apigatewayv2_route" "ai_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /" # Only protect the POST call
  target    = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Default Stage with Auto-Deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

# Give API Gateway permission to trigger Lambda
resource "aws_lambda_permission" "api_gw" {
  # Add the environment to make it unique
  statement_id  = "AllowExecutionFromAPIGateway-${var.env}" 
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  
  # This covers all routes in your API
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}