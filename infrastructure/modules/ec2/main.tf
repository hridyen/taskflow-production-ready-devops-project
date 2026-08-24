# ==========================================
# TaskFlow EC2 Module
# ==========================================
#
# Responsibilities:
#
# 1. Create SSH key pair
# 2. Select Ubuntu 22.04 AMI
# 3. Create EC2 deployment server
# 4. Install Docker + Docker Compose + Git
# 5. Create TaskFlow application directory
# 6. Create non-secret application .env
#
# Secrets such as DB_PASSWORD are NOT stored here.
# GitHub Actions CD injects DB_PASSWORD separately.
#
# ==========================================


# ----------------------------------------------------
# 1. EC2 SSH Key Pair
# ----------------------------------------------------

resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-${var.environment}-deployer-key"
  public_key = var.ssh_public_key
}


# ----------------------------------------------------
# 2. Ubuntu AMI
# ----------------------------------------------------

data "aws_ami" "ubuntu" {
  most_recent = true

  owners = ["099720109477"] # Canonical

  filter {
    name = "name"

    values = [
      "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
    ]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}


# ----------------------------------------------------
# 3. EC2 Deployment Server
# ----------------------------------------------------

resource "aws_instance" "app_server" {
  ami = data.aws_ami.ubuntu.id

  instance_type = var.instance_type

  subnet_id = var.subnet_id

  vpc_security_group_ids = [
    var.security_group_id
  ]

  key_name = aws_key_pair.deployer.key_name


  # --------------------------------------------------
  # Root Disk
  # --------------------------------------------------

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }


  # --------------------------------------------------
  # EC2 Bootstrap / User Data
  # --------------------------------------------------
  #
  # This script runs automatically on first boot.
  #
  # It prepares the EC2 for GitHub Actions CD.
  #
  # IMPORTANT:
  # The shebang MUST start at column 1.
  #
  # --------------------------------------------------

  user_data = <<-EOF
#!/bin/bash

set -e


# ==========================================
# 1. Update Operating System
# ==========================================

apt-get update -y

apt-get upgrade -y


# ==========================================
# 2. Install Required Packages
# ==========================================

apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  git


# ==========================================
# 3. Configure Docker Repository
# ==========================================

mkdir -p /etc/apt/keyrings

curl -fsSL \
  https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor \
  -o /etc/apt/keyrings/docker.gpg


echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null


# ==========================================
# 4. Install Docker Engine + Compose
# ==========================================

apt-get update -y

apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-compose-plugin


# ==========================================
# 5. Enable Docker
# ==========================================

systemctl enable docker

systemctl start docker


# ==========================================
# 6. Allow Ubuntu User to Use Docker
# ==========================================

usermod -aG docker ubuntu


# ==========================================
# 7. Create Application Directory
# ==========================================

mkdir -p \
  /home/ubuntu/taskflow-production-ready-devops-project

mkdir -p \
  /home/ubuntu/taskflow-production-ready-devops-project/secrets


chown -R ubuntu:ubuntu \
  /home/ubuntu/taskflow-production-ready-devops-project


# ==========================================
# 8. Create Non-Secret Application Config
# ==========================================
#
# These values are application configuration.
#
# DB_PASSWORD is intentionally NOT stored here.
# GitHub Actions CD injects the database password
# through secrets/db_password.
#
# ==========================================

cat > \
  /home/ubuntu/taskflow-production-ready-devops-project/.env \
  <<'ENVEOF'

# PostgreSQL
POSTGRES_DB=taskflow
POSTGRES_USER=taskflow_user

# Backend
PORT=9001
NODE_ENV=production

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=taskflow
DATABASE_USER=taskflow_user

# CORS
CORS_ORIGIN=http://localhost

# Frontend
VITE_API_URL=/api

ENVEOF


# ==========================================
# 9. Secure Environment File
# ==========================================

chmod 600 \
  /home/ubuntu/taskflow-production-ready-devops-project/.env


chown ubuntu:ubuntu \
  /home/ubuntu/taskflow-production-ready-devops-project/.env


# ==========================================
# 10. Bootstrap Completion Marker
# ==========================================

touch \
  /home/ubuntu/taskflow-production-ready-devops-project/.bootstrap_complete


chown ubuntu:ubuntu \
  /home/ubuntu/taskflow-production-ready-devops-project/.bootstrap_complete


# ==========================================
# Bootstrap Complete
# ==========================================

echo "=========================================="

echo "TaskFlow EC2 bootstrap completed"

echo "Docker installed"

echo "Docker Compose installed"

echo "Git installed"

echo "Application directory created"

echo "Non-secret .env created"

echo "Bootstrap marker created"

echo "=========================================="

EOF


  # --------------------------------------------------
  # 4. Replace EC2 When Bootstrap Changes
  # --------------------------------------------------
  #
  # This makes Terraform replace the instance whenever
  # the user_data bootstrap script changes.
  #
  # --------------------------------------------------

  user_data_replace_on_change = true


  # --------------------------------------------------
  # 5. EC2 Tags
  # --------------------------------------------------

  tags = {
    Name        = "${var.project_name}-${var.environment}-server"
    Environment = var.environment
  }
}