# backend/infra/modules/dynamodb/main.tf

# 1. Chat History Table (Existing)
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

# 2. Brand Profile Table (New - The only one you need for now)
resource "aws_dynamodb_table" "brands" {
  name         = "vinciflow-${var.env}-brands"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "UserId" # One brand per user

  attribute {
    name = "UserId"
    type = "S"
  }

  tags = {
    Name        = "VinciFlow Brand Profiles"
    Environment = var.env
  }
}