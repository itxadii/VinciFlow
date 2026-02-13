output "lambda_function_name" {
  value = aws_lambda_function.ai_agent.function_name
}

output "lambda_invoke_arn" {
  value = aws_lambda_function.ai_agent.invoke_arn
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.ai_agent.arn
}

output "lambda_function_invoke_arn" {
  description = "The Invoke ARN of the Lambda function"
  value       = aws_lambda_function.ai_agent.invoke_arn
}