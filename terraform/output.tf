output "api_cluster" {
  value = aws_ecs_cluster.main.arn
}

output "api_service" {
  value = aws_ecs_service.api.name
}

output "migration_task_definition" {
  value = aws_ecs_task_definition.database_migration.arn
}

output "task_security_group" {
  value = aws_security_group.ecs_tasks.id
}

output "subnet_private" {
  value = aws_subnet.private.0.id
}

output "api_dns" {
  value = aws_lb.api.dns_name
}
