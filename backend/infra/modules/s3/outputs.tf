output "assets_bucket_id" {
  description = "The name of the bucket"
  value       = aws_s3_bucket.assets.id
}

output "assets_bucket_arn" {
  description = "The ARN of the bucket (used for IAM policies)"
  value       = aws_s3_bucket.assets.arn
}

output "assets_bucket_domain_name" {
  description = "The bucket domain name for frontend access"
  value       = aws_s3_bucket.assets.bucket_regional_domain_name
}

output "bucket_id" {
  value = aws_s3_bucket.lambda_deployments.id
}
