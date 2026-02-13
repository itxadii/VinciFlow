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