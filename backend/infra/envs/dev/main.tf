data "aws_caller_identity" "current" {}

# 1. Authentication Module (Cognito)
module "auth" {
  source = "../../modules/cognito"
  env    = var.env
}

# 2. Database Module (DynamoDB)
# Isme memory table aur naya brands table dono defined hain.
module "dynamodb" {
  source = "../../modules/dynamodb"
  env    = var.env
}

module "bedrock_agent" {
  source = "../../modules/bedrock_agent"

  env                  = "dev"
  account_id           = data.aws_caller_identity.current.account_id
  lambda_function_arn  = module.lambda.lambda_function_arn
  lambda_function_name = module.lambda.lambda_function_name
  agent_instruction    = "You are the VinciFlow Orchestrator. Help users create posts..."
}

# 3. IAM Module (Permissions)
# Updated: Passing both table ARNs to allow Lambda access to memory AND brands.
module "iam" {
  source              = "../../modules/iam"
  env                 = var.env
  dynamodb_table_arn  = module.dynamodb.table_arn     # Compatibility (Memory Table)
  brands_table_arn    = module.dynamodb.brands_table_arn # NEW: Access to Brand Profiles
}

module "api_gateway" {
  source                      = "../../modules/api_gateway"
  env                         = var.env
  lambda_function_invoke_arn  = module.lambda.lambda_function_invoke_arn
  
  lambda_function_name        = module.lambda.lambda_function_name 
  
  cognito_user_pool_id        = module.auth.user_pool_id
  cognito_client_id           = module.auth.client_id
}

module "s3" {
  source      = "../../modules/s3"
  env         = var.env
  bucket_name = "vinciflow-lambda-deployments"
}

# Fetching Gemini Key
data "aws_ssm_parameter" "gemini_key" {
  name            = "/corex/gemini_api_key"
  with_decryption = true 
}

# Fetching X (Twitter) Secrets from SSM
data "aws_ssm_parameter" "x_api_key" {
  name            = "/vinciflow/x_api_key"
  with_decryption = true
}

data "aws_ssm_parameter" "x_api_secret" {
  name            = "/vinciflow/x_api_secret"
  with_decryption = true
}

data "aws_ssm_parameter" "x_client_id" {
  name            = "/vinciflow/x_client_id"
  with_decryption = true
}

data "aws_ssm_parameter" "x_client_secret" {
  name            = "/vinciflow/x_client_secret"
  with_decryption = true
}

# 4. Lambda Module
# Updated: Added brands_table name and arn to environment variables and permissions.
module "lambda" {
  source              = "../../modules/lambda"
  env                 = var.env
  deploy_bucket_id    = module.s3.bucket_id
  iam_role_arn        = module.iam.lambda_role_arn
  
  # Existing Memory Table
  dynamodb_table      = module.dynamodb.table_name
  dynamodb_table_arn  = module.dynamodb.table_arn
  
  # NEW: Brand Table Wiring
  brands_table_name   = module.dynamodb.brands_table_name
  brands_table_arn    = module.dynamodb.brands_table_arn
  
  api_gateway_id      = module.api_gateway.api_id
  gemini_api_key      = data.aws_ssm_parameter.gemini_key.value
  x_api_key        = data.aws_ssm_parameter.x_api_key.value
  x_api_secret     = data.aws_ssm_parameter.x_api_secret.value
  x_client_id      = data.aws_ssm_parameter.x_client_id.value
  x_client_secret  = data.aws_ssm_parameter.x_client_secret.value
}