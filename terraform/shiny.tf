locals {
  shiny_port = 3838
}

resource "aws_lb" "shiny" {
  name            = "${local.resource_prefix}-shiny"
  subnets         = var.public_subnet_ids.*
  security_groups = [aws_security_group.lb.id]

  tags = merge(
    local.tags
  )
}

resource "aws_lb_target_group" "shiny" {
  name        = "${local.resource_prefix}-shiny"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200-299"
    timeout             = "3"
    path                = "/"
    unhealthy_threshold = "2"
  }

  tags = merge(
    local.tags
  )
}

# Redirect all traffic from the ALB to the target group
resource "aws_lb_listener" "shiny" {
  load_balancer_arn = aws_lb.shiny.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.shiny.id
    type             = "forward"
  }
}

resource "aws_ecs_cluster" "shiny" {
  name = "${local.resource_prefix}-shiny"
  tags = merge(local.tags)
}

resource "aws_ecs_task_definition" "shiny" {
  family                   = "${local.resource_prefix}-shiny"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 2048 # 2 vCPUs
  memory                   = 4096 # 4 GiB RAM
  container_definitions    = <<DEFINITION
  [
    {
      "name": "shiny",
      "cpu": 2048,
      "memory": 4096,
      "essential": true,
      "image": "rocker/shiny",
      "command": ["/usr/bin/shiny-server"],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${aws_cloudwatch_log_group.api.name}",
          "awslogs-region": "${var.aws_region}",
          "awslogs-stream-prefix": "shiny"
        }
      },
      "portMappings": [
        {
          "containerPort": ${local.shiny_port}
        }
      ],
      "user": "shiny"
    }
  ]
  DEFINITION

  tags = merge(
    local.tags
  )
}

resource "aws_ecs_service" "shiny" {
  name            = "${local.resource_prefix}-shiny"
  cluster         = aws_ecs_cluster.shiny.id
  task_definition = aws_ecs_task_definition.shiny.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.shiny.id]
    subnets          = var.private_subnet_ids.*
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.shiny.id
    container_name   = "shiny"
    container_port   = local.shiny_port
  }

  depends_on = [aws_lb_listener.shiny, aws_iam_role_policy_attachment.ecs_task_execution_policy]

  tags = merge(local.tags)
}
