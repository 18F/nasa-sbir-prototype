variable "aws_profile" {
  type    = string
  default = "sbir-sandbox"
}

variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "permission_boundary" {
  type = string
}

locals {
  tags = {
    Name    = local.resource_prefix
    project = "1337_nasa_sbir"
  }
  resource_prefix = "ehb-prototype"
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

# === App-specific ===

locals {
  api_health_check_path = "/heartbeat"
  api_port              = 8000
}

variable "api_container_version" {
  type    = string
  default = "latest"
}
