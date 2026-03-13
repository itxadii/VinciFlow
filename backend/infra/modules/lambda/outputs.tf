output "api_lambda_name" { value = aws_lambda_function.api_lambda.function_name }
output "api_lambda_arn" { value = aws_lambda_function.api_lambda.arn }
output "api_lambda_invoke_arn" { value = aws_lambda_function.api_lambda.invoke_arn }

output "pipeline_lambda_arn" { value = aws_lambda_function.pipeline_lambda.arn }
output "publish_lambda_arn" { value = aws_lambda_function.publish_lambda.arn }