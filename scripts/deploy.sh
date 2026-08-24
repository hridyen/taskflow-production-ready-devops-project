#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

echo "=========================================="
echo " TaskFlow Deployment"
echo "=========================================="

# ------------------------------------------
# 1. Validate environment
# ------------------------------------------

echo "[1/6] Checking environment configuration..."

if [ ! -f ".env" ]; then
    echo "ERROR: .env does not exist."
    echo ""
    echo "Create it from .env.example:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# ------------------------------------------
# 2. Validate DB secret
# ------------------------------------------

echo "[2/6] Checking database secret..."

if [ ! -f "secrets/db_password" ]; then
    echo "ERROR: secrets/db_password does not exist."
    echo ""
    echo "Create it with:"
    echo "  mkdir -p secrets"
    echo "  echo 'YOUR_PASSWORD' > secrets/db_password"
    echo "  chmod 600 secrets/db_password"
    exit 1
fi

chmod 600 secrets/db_password

# ------------------------------------------
# 3. Validate Compose
# ------------------------------------------

echo "[3/6] Validating Docker Compose..."

docker compose config >/dev/null

echo "Compose configuration OK."

# ------------------------------------------
# 4. Build images
# ------------------------------------------

echo "[4/6] Building application images..."

docker compose build

# ------------------------------------------
# 5. Start application
# ------------------------------------------

echo "[5/6] Starting TaskFlow..."

docker compose up -d

# ------------------------------------------
# 6. Health check
# ------------------------------------------

echo "[6/6] Waiting for application..."

sleep 10

"$PROJECT_DIR/scripts/health-check.sh"

echo ""
echo "=========================================="
echo " TaskFlow deployment successful!"
echo "=========================================="