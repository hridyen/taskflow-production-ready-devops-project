#!/bin/bash

set -e

BASE_URL="${TASKFLOW_URL:-http://localhost}"

echo "=========================================="
echo " TaskFlow Health Check"
echo "=========================================="

echo ""
echo "Checking database health..."

DB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE_URL/api/db-health")

echo "DB Health: HTTP $DB_STATUS"

echo ""
echo "Checking tasks API..."

TASK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE_URL/api/tasks")

echo "Tasks API: HTTP $TASK_STATUS"

echo ""

if [ "$DB_STATUS" != "200" ]; then
    echo "ERROR: Database health check failed."
    exit 1
fi

if [ "$TASK_STATUS" != "200" ]; then
    echo "ERROR: Tasks API health check failed."
    exit 1
fi

echo "=========================================="
echo " TaskFlow is HEALTHY"
echo "=========================================="