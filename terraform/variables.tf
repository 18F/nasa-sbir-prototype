variable "aws_profile" {
  default = "tts-sandbox"
}

variable "aws_region" {
  default = "us-east-2"
}

variable "az_count" {
  default = "2"
}

variable "default_tags" {
  default = {
    Name    = "ehb-prototype"
    project = "1337_nasa_sbir"
  }
}

variable "health_check_path" {
  default = "/heartbeat"
}

variable "resource_prefix" {
  default = "ehb-prototype"
}

# === App-specific ===

variable "api_container_version" {
  default = "latest"
}

variable "api_port" {
  default = "8000"
}
