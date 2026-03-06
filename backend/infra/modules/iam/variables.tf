# backend/infra/modules/iam/variables.tf

variable "env" { 
  type = string 
}

variable "dynamodb_table_arn" { 
  type = string 
}

variable "brands_table_arn" { 
  type = string 
}

variable "state_machine_arn" { 
  type = string 
}

variable "agent_role_arn" {
  type        = string
  description = "The ARN of the IAM role assigned to the Bedrock Agent"
}

variable "assets_bucket_arn" {
  type        = string
  description = "The ARN of the assets bucket from S3 module"
}