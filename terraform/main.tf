terraform {
  backend "s3" {
    bucket  = "terraform.sandbox.sbir.nasa"
    key     = "terraform.tfstate"
    profile = "sbir-sandbox"
    region  = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }
}

provider "aws" {
  profile = var.aws_profile
  region  = var.aws_region
}
