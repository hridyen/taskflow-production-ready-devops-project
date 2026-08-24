terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ----------------------------------------------------
# VPC Module
# ----------------------------------------------------
module "vpc" {
  source            = "./modules/vpc"
  project_name      = var.project_name
  environment       = var.environment
  availability_zone = "${var.aws_region}a"
}

# ----------------------------------------------------
# Security Groups Module
# ----------------------------------------------------
module "security_groups" {
  source       = "./modules/security_groups"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# ----------------------------------------------------
# EC2 Instance Module
# ----------------------------------------------------
module "ec2" {
  source            = "./modules/ec2"
  project_name      = var.project_name
  environment       = var.environment
  instance_type     = var.instance_type
  subnet_id         = module.vpc.public_subnet_id
  security_group_id = module.security_groups.web_sg_id
  ssh_public_key    = var.ssh_public_key
}
