# backend/infra/modules/api_gateway/main.tf

resource "aws_apigatewayv2_api" "main" {
  name          = "vinciflow-${var.env}-api"
  protocol_type = "HTTP"

  # CoreX ke MOCK integrations ki jagah yahan single block hai
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

# The JWT Authorizer (Cognito integration)
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
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_function_invoke_arn
  payload_format_version = "2.0"
}

# --- ROUTES ---

# 1. POST Route for Chat (AI Agent)
resource "aws_apigatewayv2_route" "chat_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /" 
  target    = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# 2. GET Route for History (SOLVES 404 ERROR)
resource "aws_apigatewayv2_route" "history_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /" 
  target    = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Optional: Catch-all route to prevent 404s on other paths
resource "aws_apigatewayv2_route" "any_proxy" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# --- DEPLOYMENT ---

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway-${var.env}" 
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# backend/infra/modules/api_gateway/main.tf

# 1. Sabse pehle OPTIONS route banayein jisme koi Authorization na ho
resource "aws_apigatewayv2_route" "options_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "OPTIONS /{proxy+}" # Sabhi paths ke liye OPTIONS handle karega
  target    = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  
  authorization_type = "NONE"
}

# 2. Same for root path OPTIONS
resource "aws_apigatewayv2_route" "options_root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "OPTIONS /"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  
  authorization_type = "NONE"
}