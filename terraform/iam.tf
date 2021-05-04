# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name                 = "${local.resource_prefix}-ecs-execution"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_policy.json
  permissions_boundary = var.permission_boundary

  # Allow ECS tasks to read the database connection string from the SSM
  inline_policy {
    name = "${local.resource_prefix}-ecs-task-policy"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = ["ssm:GetParameters"]
          Effect   = "Allow"
          Resource = ["${aws_ssm_parameter.db_connection_string.arn}"]
        }
      ]
    })
  }

  tags = merge(
    local.tags
  )
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name                 = "${local.resource_prefix}-ecs-task"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_policy.json
  permissions_boundary = var.permission_boundary

  inline_policy {
    name = "${local.resource_prefix}-ecs-task-policy"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = ["s3:GetObject"]
          Effect   = "Allow"
          Resource = ["arn:aws:s3:::${var.s3_data_bucket}/${var.s3_data_file}"]
        }
      ]
    })
  }

  tags = merge(
    local.tags
  )
}
