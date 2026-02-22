output "dev_cognito_pool_id" {
  value = module.auth.user_pool_id
}

output "dev_cognito_client_id" {
  value = module.auth.client_id
}

output "dev_dynamodb_table_name" {
  # Change 'database' to 'dynamodb' to match your main.tf
  value = module.dynamodb.table_name 
}

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