# backend/infra/modules/api_gateway/main.tf

resource "aws_apigatewayv2_api" "main" {
  name          = "vinciflow-${var.env}-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "vinciflow-auth"

  jwt_configuration {
    audience = [var.cognito_client_id]
    # FIX: Using trimspace to prevent the 'Invalid Issuer' 400 error
    issuer   = "https://cognito-idp.ap-south-1.amazonaws.com/${trimspace(var.cognito_user_pool_id)}"
  }
}

resource "aws_apigatewayv2_integration" "lambda_handler" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_function_invoke_arn # Points to api_lambda
  payload_format_version = "2.0"
}

# --- 1. THE PREFLIGHT BYPASS (MUST BE AT THE TOP) ---
resource "aws_apigatewayv2_route" "options_proxy" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "OPTIONS /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "NONE" # Bypass JWT for safety check
}

resource "aws_apigatewayv2_route" "options_root" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "OPTIONS /"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "NONE" # Bypass JWT for root path
}

# --- 2. PROTECTED ROUTES ---
resource "aws_apigatewayv2_route" "brand_get" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /brand"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "brand_post" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /brand"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "chat_post" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "history_get" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# --- 3. THE CATCH-ALL (MUST BE METHOD SPECIFIC OR REMOVED) ---
# We use GET/POST instead of ANY to prevent it from stealing OPTIONS
resource "aws_apigatewayv2_route" "any_proxy_get" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "any_proxy_post" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_handler.id}"
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
  function_name = var.lambda_function_name # api_lambda name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
