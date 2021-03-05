resource "random_password" "database_password" {
  length           = 32
  special          = true
  override_special = "~!#$^*-_"
}

resource "random_string" "database_username" {
  length  = 31
  special = false
}

resource "aws_db_subnet_group" "default" {
  name       = local.resource_prefix
  subnet_ids = aws_subnet.private.*.id

  tags = merge(
    local.tags
  )
}

resource "aws_db_instance" "main" {
  name                 = replace(local.resource_prefix, "/[^a-zA-Z0-9]/", "")
  identifier           = "${local.resource_prefix}-db"
  db_subnet_group_name = aws_db_subnet_group.default.name

  allocated_storage          = 100 # this is the minimum-allowed value
  instance_class             = "db.t3.micro"
  engine                     = "postgres"
  engine_version             = "13.1"
  auto_minor_version_upgrade = true
  multi_az                   = false
  vpc_security_group_ids     = [aws_security_group.rds.id]

  # We don't actually need these values outside of AWS, ever, so randomize them
  # and lock them away. The username must begin with a letter, though, so...
  # start with a letter.
  password = random_password.database_password.result
  username = "u${random_string.database_username.result}"

  # Disable the final snapshot; otherwise, terraform can't delete the RDS
  # instances.
  skip_final_snapshot = true

  tags = merge(
    local.tags
  )
}
