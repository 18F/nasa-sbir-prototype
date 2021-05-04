resource "aws_ecs_cluster" "main" {
  name = "${local.resource_prefix}-api"
  tags = merge(
    local.tags
  )
}

locals {
  migration_task_template = templatefile("${path.module}/ecs_task_migrate.json.tpl", {
    DB_URL_ARN     = aws_ssm_parameter.db_connection_string.arn
    LOG_GROUP      = aws_cloudwatch_log_group.api.name
    LOG_REGION     = var.aws_region
    REPOSITORY_URL = replace(aws_ecr_repository.api.repository_url, "https://", "")
    IMAGE_VERSION  = var.api_container_version
  })

  seed_task_template = templatefile("${path.module}/ecs_task_seed.json.tpl", {
    DB_URL_ARN     = aws_ssm_parameter.db_connection_string.arn
    LOG_GROUP      = aws_cloudwatch_log_group.api.name
    LOG_REGION     = var.aws_region
    REPOSITORY_URL = replace(aws_ecr_repository.api.repository_url, "https://", "")
    IMAGE_VERSION  = var.api_container_version
    S3_REGION      = var.aws_region
    S3_DATA_BUCKET = var.s3_data_bucket
    S3_DATA_FILE   = var.s3_data_file
  })

  service_task_template = templatefile("${path.module}/ecs_task_definition.json.tpl", {
    DB_URL_ARN     = aws_ssm_parameter.db_connection_string.arn
    PORT           = local.api_port
    LOG_GROUP      = aws_cloudwatch_log_group.api.name
    LOG_REGION     = var.aws_region
    REPOSITORY_URL = replace(aws_ecr_repository.api.repository_url, "https://", "")
    IMAGE_VERSION  = var.api_container_version
  })
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.resource_prefix}-api"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  container_definitions    = local.service_task_template

  tags = merge(
    local.tags
  )
}

resource "aws_ecs_task_definition" "database_migration" {
  family                   = "${local.resource_prefix}-database-migration"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  container_definitions    = local.migration_task_template

  tags = merge(
    local.tags
  )
}

resource "aws_ecs_task_definition" "database_seed" {
  family                   = "${local.resource_prefix}-database-seed"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  container_definitions    = local.seed_task_template

  tags = merge(
    local.tags
  )
}

resource "aws_ecs_service" "api" {
  name            = "${local.resource_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = var.private_subnet_ids.*
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.id
    container_name   = "api"
    container_port   = local.api_port
  }

  depends_on = [aws_lb_listener.front_end, aws_iam_role_policy_attachment.ecs_task_execution_policy]

  tags = merge(
    local.tags
  )
}

resource "aws_ecr_repository" "api" {
  name = "${local.resource_prefix}-api"
  tags = merge(
    local.tags
  )
}
