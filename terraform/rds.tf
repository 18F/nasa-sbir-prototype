resource "random_password" "database_password" {
  length           = 24
  special          = true
  override_special = "_%@"
}

resource "aws_db_subnet_group" "default" {
  name       = "nasa-sbir-main"
  subnet_ids = aws_subnet.private.*.id

  tags = merge(
    var.default_tags
  )
}

resource "aws_db_instance" "main" {
  name                 = "sbir_ehb_prototype"
  identifier           = "sbir-ehb-prototype"
  db_subnet_group_name = aws_db_subnet_group.default.name

  allocated_storage          = 100
  instance_class             = "db.t3.micro"
  engine                     = "postgres"
  engine_version             = "13.1"
  auto_minor_version_upgrade = true
  multi_az                   = false
  vpc_security_group_ids     = [aws_security_group.rds.id]

  username = "ehb"
  password = random_password.database_password.result

  skip_final_snapshot = true

  tags = merge(
    var.default_tags
  )
}