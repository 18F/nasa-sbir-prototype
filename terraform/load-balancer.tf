resource "aws_lb" "api" {
  name            = "${local.resource_prefix}-api"
  subnets         = var.public_subnet_ids.*
  security_groups = [aws_security_group.lb.id]

  tags = merge(
    local.tags
  )
}

resource "aws_lb_target_group" "api" {
  name        = "${local.resource_prefix}-api"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    port                = local.api_port
    matcher             = "200"
    timeout             = "3"
    path                = local.api_health_check_path
    unhealthy_threshold = "2"
  }

  tags = merge(
    local.tags
  )
}

# Redirect all traffic from the ALB to the target group
resource "aws_lb_listener" "front_end" {
  load_balancer_arn = aws_lb.api.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.api.id
    type             = "forward"
  }
}
