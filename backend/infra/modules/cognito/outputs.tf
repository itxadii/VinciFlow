output "user_pool_id" {
  value = aws_cognito_user_pool.pool.id # Expose ID to the root module
}

output "client_id" {
  value = aws_cognito_user_pool_client.client.id
}