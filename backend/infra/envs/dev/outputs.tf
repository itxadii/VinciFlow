# Cognito Outputs
output "dev_cognito_pool_id" {
  value = module.auth.user_pool_id
}

output "dev_cognito_client_id" {
  value = module.auth.client_id
}

# DynamoDB Memory/Chat Table Outputs
output "dev_dynamodb_table_name" {
  description = "The name of the chat history table"
  value       = module.dynamodb.table_name 
}

output "dev_dynamodb_table_arn" {
  description = "The ARN of the chat history table"
  value       = module.dynamodb.table_arn
}

# NEW: Brand Profiles Table Outputs
output "dev_brands_table_name" {
  description = "The name of the persistent brand configurations table"
  value       = module.dynamodb.brands_table_name
}

output "dev_brands_table_arn" {
  description = "The ARN of the brand profiles table"
  value       = module.dynamodb.brands_table_arn
}

# API Gateway & Bedrock Agent Outputs
output "dev_api_endpoint" {
  value = module.api_gateway.api_endpoint
}

output "vinciflow_agent_id" {
  description = "The unique identifier for the Bedrock Agent"
  value       = module.bedrock_agent.agent_id
}

output "vinciflow_agent_arn" {
  description = "The ARN of the Bedrock Agent"
  value       = module.bedrock_agent.agent_arn
}