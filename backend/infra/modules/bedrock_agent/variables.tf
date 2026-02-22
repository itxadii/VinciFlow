# backend/infra/modules/bedrock_agent/variables.tf

variable "env" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID for resource policies"
  type        = string
}

variable "lambda_function_arn" {
  description = "The ARN of the Lambda function for Action Groups"
  type        = string
}

variable "lambda_function_name" {
  description = "The Name of the Lambda function for permission resource"
  type        = string
}

variable "agent_instruction" {
  description = "The system prompt instructions for the Bedrock Agent"
  type        = string
  default     = "You are a helpful assistant for VinciFlow."
}