variable "env" {
  description = "Deployment environment"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "The ARN of the chat history (memory) table"
  type        = string
}

# NEW: Input for the Brand Profiles table
variable "brands_table_arn" {
  description = "The ARN of the brand profiles table"
  type        = string
}