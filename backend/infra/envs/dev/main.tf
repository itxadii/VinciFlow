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
  source                = "../../modules/bedrock_agent"
  env                   = var.env
  account_id            = data.aws_caller_identity.current.account_id
  lambda_function_arn   = module.lambda.api_lambda_arn
  lambda_function_name  = module.lambda.api_lambda_name
}

module "step_functions" {
  source                   = "../../modules/step_functions"
  env                      = var.env
  # 🚀 Pointing all tasks to Pipeline Lambda
  lambda_intent_parser_arn = module.lambda.pipeline_lambda_arn
  lambda_generator_arn     = module.lambda.pipeline_lambda_arn
  lambda_branding_arn      = module.lambda.pipeline_lambda_arn
  lambda_storage_arn       = module.lambda.pipeline_lambda_arn
}

# 3. IAM Module (Permissions)
module "iam" {
  source                 = "../../modules/iam"
  env                    = var.env
  dynamodb_table_arn     = module.dynamodb.table_arn
  brands_table_arn       = module.dynamodb.brands_table_arn
  state_machine_arn      = module.step_functions.state_machine_arn
  agent_role_arn         = module.bedrock_agent.agent_role_arn 
  assets_bucket_arn      = module.brand_assets_s3.assets_bucket_arn
}

module "brand_assets_s3" {
  source      = "../../modules/s3"
  bucket_name = "vinciflow-${var.env}-brand-assets"
  env         = var.env
  tags = {
    Project = "VinciFlow"
    Owner   = "Aditya"
  }
}

module "api_gateway" {
  source                      = "../../modules/api_gateway"
  env                         = var.env
  # 🚀 Pointing to API Lambda
  lambda_function_invoke_arn  = module.lambda.api_lambda_invoke_arn
  lambda_function_name        = module.lambda.api_lambda_name
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
  source             = "../../modules/lambda"
  env                = var.env
  iam_role_arn       = module.iam.lambda_role_arn
  
  deploy_bucket_id   = module.s3.bucket_id
  api_gateway_id     = module.api_gateway.api_id

  # Tables & Roles
  dynamodb_table     = module.dynamodb.table_name
  dynamodb_table_arn = module.dynamodb.table_arn
  brands_table_name  = module.dynamodb.brands_table_name
  brands_table_arn   = module.dynamodb.brands_table_arn
  scheduler_role_arn = module.iam.scheduler_role_arn
  assets_bucket_name = module.brand_assets_s3.assets_bucket_id
  
  # Trigger Config
  state_machine_arn  = module.step_functions.state_machine_arn
  
  # Secrets from SSM
  gemini_api_key     = data.aws_ssm_parameter.gemini_key.value
  x_client_id        = data.aws_ssm_parameter.x_client_id.value
  x_client_secret    = data.aws_ssm_parameter.x_client_secret.value
  x_api_key          = data.aws_ssm_parameter.x_api_key.value
  x_api_secret       = data.aws_ssm_parameter.x_api_secret.value
}
resource "aws_ssm_parameter" "sfn_arn" {
  name  = "/vinciflow/${var.env}/state_machine_arn"
  type  = "String"
  value = module.step_functions.state_machine_arn
}