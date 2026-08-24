output "ec2_public_ip" {
  description = "The public IP address of the EC2 instance for the application"
  value       = module.ec2.public_ip
}

output "ec2_public_dns" {
  description = "The public DNS name of the EC2 instance"
  value       = module.ec2.public_dns
}

output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = module.vpc.vpc_id
}
