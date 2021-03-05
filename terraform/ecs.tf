resource "aws_ecs_cluster" "main" {
  name = "${local.resource_prefix}-api"
  tags = merge(
    local.tags
  )
}

data "template_file" "api_task_definition" {
  template = file("ecs_task_definition.json.tpl")
  vars = {
    DB_NAME        = aws_db_instance.main.name
    DB_HOST        = aws_db_instance.main.address
    DB_USER        = urlencode(aws_db_instance.main.username)
    DB_PASSWORD    = urlencode(aws_db_instance.main.password)
    PORT           = local.api_port
    LOG_GROUP      = aws_cloudwatch_log_group.api.name
    LOG_REGION     = var.aws_region
    REPOSITORY_URL = replace(aws_ecr_repository.api.repository_url, "https://", "")
    IMAGE_VERSION  = var.api_container_version
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.resource_prefix}-api"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  container_definitions    = data.template_file.api_task_definition.rendered

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
    subnets          = aws_subnet.private.*.id
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
