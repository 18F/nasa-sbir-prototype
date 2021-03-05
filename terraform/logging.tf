resource "aws_cloudwatch_log_group" "api" {
  name = "${var.resource_prefix}-api"

  tags = merge(
    var.default_tags
  )
}
