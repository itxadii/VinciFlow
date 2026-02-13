# 1. Authentication Module (Cognito)
module "auth" {
  source = "../../modules/cognito"
  env    = var.env
}

# 2. Database Module (DynamoDB)
# Renamed to match your module folder naming convention
module "dynamodb" {
  source = "../../modules/dynamodb"
  env    = var.env
}

# 3. IAM Module (Permissions)
# Passing the table_arn here avoids circular loops
module "iam" {
  source             = "../../modules/iam"
  env                = var.env
  dynamodb_table_arn = module.dynamodb.table_arn 
}

module "api_gateway" {
  source                     = "../../modules/api_gateway"
  env                        = var.env
  # This name MUST match the variable name in the module exactly
  lambda_function_invoke_arn = module.lambda.lambda_function_invoke_arn 
}

data "aws_ssm_parameter" "gemini_key" {
  name            = "/corex/gemini_api_key"
  with_decryption = true # Ensure SecureString is decrypted
}

module "lambda" {
  source          = "../../modules/lambda"
  env             = var.env
  iam_role_arn    = module.iam.lambda_role_arn
  dynamodb_table  = module.dynamodb.table_name
  api_gateway_id  = module.api_gateway.api_id
  
  # Inject the value from SSM directly
  gemini_api_key  = data.aws_ssm_parameter.gemini_key.value
}