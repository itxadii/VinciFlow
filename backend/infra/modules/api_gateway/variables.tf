variable "lambda_function_name" {
  type        = string
  description = "The name of the Lambda function for permissions"
}

# Ensure your other variables are there too
variable "env" { type = string }
variable "lambda_function_invoke_arn" { type = string }
variable "cognito_user_pool_id" { type = string }
variable "cognito_client_id" { type = string }