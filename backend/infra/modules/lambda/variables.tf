variable "env" { type = string }
variable "iam_role_arn" { type = string }
variable "dynamodb_table" { type = string }
variable "api_gateway_id" { type = string }

variable "gemini_api_key" {
  description = "Gemini API Key fetched from SSM"
  type        = string
  sensitive   = true # Prevents the key from showing in terminal logs
}
variable "deploy_bucket_id" {
  type = string
}