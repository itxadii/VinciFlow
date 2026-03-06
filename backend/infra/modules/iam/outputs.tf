output "lambda_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}

output "scheduler_role_arn" {
  value = aws_iam_role.scheduler_role.arn
}