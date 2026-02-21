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