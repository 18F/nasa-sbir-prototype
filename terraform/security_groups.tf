# ALB Security Group: Edit to restrict access to the application
resource "aws_security_group" "lb" {
  name        = "ehb-load-balancer"
  description = "controls access to the ALB"
  vpc_id      = aws_vpc.main.id

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
    var.default_tags,
    { Name = "nasa_sbir_prototype_lb" }
  )
}

resource "aws_security_group" "rds" {
  name        = "ehb-rds"
  description = "allows Postgres traffic to RDS from ECS only"
  vpc_id      = aws_vpc.main.id

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
    var.default_tags,
    { Name = "nasa_sbir_prototype_rds" }
  )
}

# Traffic to the ECS cluster should only come from the ALB
resource "aws_security_group" "ecs_tasks" {
  name        = "ehb-ecs-tasks"
  description = "allow inbound access from the ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = var.app_port
    to_port         = var.app_port
    security_groups = [aws_security_group.lb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.default_tags,
    { Name = "nasa_sbir_prototype_ecs" }
  )

}
