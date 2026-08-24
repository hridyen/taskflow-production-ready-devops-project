output "public_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "public_dns" {
  description = "The public DNS of the EC2 instance"
  value       = aws_instance.app_server.public_dns
}
