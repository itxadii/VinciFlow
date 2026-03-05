# S3 Bucket for Brand Assets (Generated Images)

resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "${var.bucket_name}-${var.env}"
}

# Ensure the bucket is private
resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.lambda_deployments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "assets" {
  bucket = "vinciflow-${var.env}-assets"
  
  tags = {
    Name        = "VinciFlow Brand Assets"
    Environment = var.env
  }
}

# CORS Policy so React can display images
resource "aws_s3_bucket_cors_configuration" "assets_cors" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"] # Production mein ise apne domain tak limit karein
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}