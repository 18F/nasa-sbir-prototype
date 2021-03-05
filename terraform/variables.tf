variable "aws_profile" {
  type    = string
  default = "tts-sandbox"
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "az_count" {
  type    = number
  default = 2
}

locals {
  tags = {
    Name    = local.resource_prefix
    project = "1337_nasa_sbir"
  }
  resource_prefix = "ehb-prototype"
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
