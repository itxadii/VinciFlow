variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-south-1" # Your preferred Mumbai region
}

variable "env" {
  description = "Environment name (dev/prod)"
  type        = string
  default     = "dev"
}

variable "bedrock_agent_id" { type = string }
variable "bedrock_agent_alias_id" { type = string }
