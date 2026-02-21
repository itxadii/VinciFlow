# modules/cognito/main.tf

resource "aws_cognito_user_pool" "pool" {
  name = "vinciflow-${var.env}-user-pool"

  # Allows users to log in with their email address
  alias_attributes = ["email"]

  schema {
    name                = "brand_voice"
    attribute_data_type = "String"
    mutable             = true
    required            = false
    
    # Matching AWS defaults exactly to prevent perpetual diffs
    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  # Prevents Terraform from trying to modify the schema after creation
  lifecycle {
    ignore_changes = [schema]
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "vinciflow-${var.env}-client"
  user_pool_id = aws_cognito_user_pool.pool.id

  # Required for Amplify/React frontend authentication
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]
}