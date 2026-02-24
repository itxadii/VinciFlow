# Ye names aapke root main.tf ki wiring ke liye zaroori hain

output "table_arn" {
  description = "Required by root main.tf for IAM and Lambda modules"
  value       = aws_dynamodb_table.agent_memory.arn
}

output "table_name" {
  description = "Required by root main.tf for Lambda env variables"
  value       = aws_dynamodb_table.agent_memory.name
}

# Naye names (Future use ke liye safe hain)
output "brands_table_arn" {
  value = aws_dynamodb_table.brands.arn
}

output "brands_table_name" {
  value = aws_dynamodb_table.brands.name
}