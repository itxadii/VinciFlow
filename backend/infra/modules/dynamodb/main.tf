# backend/infra/modules/dynamodb/main.tf

resource "aws_dynamodb_table" "state_locking" {
  name         = "vinciflow-${var.env}-state-lock"
  billing_mode = "PAY_PER_REQUEST" # Best for dev/prod to save costs
  hash_key     = "LockID"         # CRITICAL: Must be exactly "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock Table"
    Environment = var.env
  }
}

resource "aws_dynamodb_table" "agent_memory" {
  name           = "vinciflow-${var.env}-memory"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "UserId"
  range_key      = "Timestamp"

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "N"
  }
}