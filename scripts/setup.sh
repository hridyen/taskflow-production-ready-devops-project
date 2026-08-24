#!/bin/bash

set -e

echo "=========================================="
echo " TaskFlow VPS Setup"
echo "=========================================="

echo "[1/5] Updating system..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "[2/5] Installing required packages..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git

echo "[3/5] Installing Docker..."

sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL \
    https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y

sudo apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

echo "[4/5] Enabling Docker..."

sudo systemctl enable docker
sudo systemctl start docker

echo "[5/5] Adding current user to docker group..."

sudo usermod -aG docker "$USER"

echo ""
echo "=========================================="
echo " TaskFlow VPS setup complete!"
echo "=========================================="
echo ""
echo "IMPORTANT:"
echo "Log out and log back in before using Docker"
echo "without sudo."
echo ""
echo "Then verify:"
echo "  docker --version"
echo "  docker compose version"
echo "=========================================="