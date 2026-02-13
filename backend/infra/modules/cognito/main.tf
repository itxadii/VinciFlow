# modules/cognito/main.tf
resource "aws_cognito_user_pool" "pool" {
  name = "vinciflow-${var.env}-user-pool"

  schema {
    attribute_data_type = "String"
    name                = "brand_voice" # Reduced from 'brand_voice_preference'
    mutable             = true
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "vinciflow-${var.env}-client"
  user_pool_id = aws_cognito_user_pool.pool.id
}