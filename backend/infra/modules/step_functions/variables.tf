variable "env" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier"
  type        = string
  default     = "vinciflow"
}

variable "lambda_intent_parser_arn" {
  type = string
}

variable "lambda_generator_arn" {
  type = string
}

variable "lambda_branding_arn" {
  type = string
}

variable "lambda_storage_arn" {
  type = string
}