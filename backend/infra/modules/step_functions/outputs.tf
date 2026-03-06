output "state_machine_arn" {
  description = "The ARN of the Content Generation State Machine"
  value       = aws_sfn_state_machine.content_pipeline.arn
}

output "state_machine_name" {
  value = aws_sfn_state_machine.content_pipeline.name
}