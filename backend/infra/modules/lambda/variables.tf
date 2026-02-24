variable "env" { type = string }
variable "iam_role_arn" { type = string }
variable "api_gateway_id" { type = string }
variable "deploy_bucket_id" { type = string }

# Memory Table Wiring
variable "dynamodb_table" { 
  type        = string 
  description = "Name of the memory table"
}

variable "dynamodb_table_arn" {
  type        = string
  description = "The ARN of the memory table"
}

# NEW: Brands Table Wiring
variable "brands_table_name" {
  type        = string
  description = "Name of the brand profiles table"
}

variable "brands_table_arn" {
  type        = string
  description = "The ARN of the brand profiles table"
}

variable "gemini_api_key" {
  description = "Gemini API Key fetched from SSM"
  type        = string
  sensitive   = true 
}