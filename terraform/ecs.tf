resource "aws_ecs_cluster" "main" {
  name = "ehb_prototype_api"
  tags = merge(
    var.default_tags
  )
}

data "template_file" "api" {
  template = file("ecs_task_definition.json.tpl")
  vars = {
    DB_HOST        = aws_db_instance.main.address
    DB_USER        = aws_db_instance.main.username
    DB_PASSWORD    = aws_db_instance.main.password
    PORT           = var.app_port
    REPOSITORY_URL = replace(aws_ecr_repository.ehb_prototype_api.repository_url, "https://", "")
    IMAGE_VERSION  = "0.0.1"
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "api-task"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  container_definitions    = data.template_file.api.rendered

  tags = merge(
    var.default_tags
  )
}

resource "aws_ecs_service" "main" {
  name            = "api-service"
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
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "api"
    container_port   = var.app_port
  }

  depends_on = [aws_alb_listener.front_end, aws_iam_role_policy_attachment.ecs_task_execution_policy]

  tags = merge(
    var.default_tags
  )
}

resource "aws_ecr_repository" "ehb_prototype_api" {
  name = "ehb_prototype_api"
  tags = merge(
    var.default_tags
  )
}
