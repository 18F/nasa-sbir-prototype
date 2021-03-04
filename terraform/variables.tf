variable "default_tags" {
  default = { project = "1337_nasa_sbir" }
}

variable "az_count" {
  default = "2"
}

variable "app_port" {
  default = "8000"
}

variable "health_check_path" {
  default = "/heartbeat"
}