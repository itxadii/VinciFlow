output "table_arn" {
  description = "The ARN of the agent_memory table for IAM policies"
  value       = aws_dynamodb_table.agent_memory.arn
}

output "table_name" {
  description = "The name of the table for Lambda environment variables"
  value       = aws_dynamodb_table.agent_memory.name
}