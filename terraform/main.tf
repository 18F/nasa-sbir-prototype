terraform {
  backend "s3" {
    bucket  = "1337-nasa-sbir-terraform"
    key     = "terraform.tfstate"
    profile = "tts-sandbox"
    region  = "us-east-2"
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
