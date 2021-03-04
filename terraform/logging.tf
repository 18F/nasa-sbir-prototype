resource "aws_cloudwatch_log_group" "main" {
  name = "nasa_sbir_prototype"

  tags = merge(
    var.default_tags
  )
}