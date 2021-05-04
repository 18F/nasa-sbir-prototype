# Securely stash the database URL in the SSM
resource "aws_ssm_parameter" "db_connection_string" {
  name  = "/production/database/url"
  type  = "SecureString"
  value = "postgresql://${aws_db_instance.main.username}:${aws_db_instance.main.password}@${aws_db_instance.main.address}/${aws_db_instance.main.name}"
}
