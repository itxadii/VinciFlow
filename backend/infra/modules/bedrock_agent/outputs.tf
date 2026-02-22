# backend/infra/modules/bedrock_agent/outputs.tf

output "agent_id" {
  description = "The unique identifier of the Bedrock Agent"
  value       = aws_bedrockagent_agent.this.id
}

output "agent_arn" {
  description = "The Amazon Resource Name of the Bedrock Agent"
  value       = aws_bedrockagent_agent.this.agent_arn
}

output "agent_role_arn" {
  description = "The ARN of the IAM role assigned to the agent"
  value       = aws_iam_role.agent_role.arn
}