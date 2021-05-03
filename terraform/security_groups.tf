# Security group for the load balancer. Accept port 80 from everywhere. This
# should change to 80 and 443 if SSL is available, and 80 should do a redirect
# to 443.
resource "aws_security_group" "lb" {
  name        = "${local.resource_prefix}-load-balancer"
  description = "controls access to the ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 0
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    { Name = "${local.resource_prefix}-load-balancer" }
  )
}

# The database will only accept traffic from the ECS tasks
resource "aws_security_group" "rds" {
  name        = "${local.resource_prefix}-database"
  description = "allows Postgres traffic to RDS from ECS only"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 0
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    { Name = "${local.resource_prefix}-database" }
  )
}

# Traffic to the ECS cluster should only come from the load balancer
resource "aws_security_group" "ecs_tasks" {
  name        = "${local.resource_prefix}-ecs-task"
  description = "allow inbound access from the ALB only"
  vpc_id      = var.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = local.api_port
    to_port         = local.api_port
    security_groups = [aws_security_group.lb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    { Name = "${local.resource_prefix}-ecs-task" }
  )
}

resource "aws_security_group" "shiny" {
  name        = "${local.resource_prefix}-shiny"
  description = "allow inbound access from the ALB only"
  vpc_id      = var.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = 3838
    to_port         = 3838
    security_groups = [aws_security_group.lb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.tags,
    { Name = "${local.resource_prefix}-shiny" }
  )
}
