resource "aws_cloudwatch_log_group" "api" {
  name = "${local.resource_prefix}-api"

  tags = merge(
    local.tags
  )
}
