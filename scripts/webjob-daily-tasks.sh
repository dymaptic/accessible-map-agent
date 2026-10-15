#!/bin/bash
# Azure WebJob script for daily cron tasks
# This script calls the daily-tasks API endpoint

# Get the app URL from environment or use default
APP_URL="${NEXT_PUBLIC_APP_URL:-https://dy-ama.azurewebsites.net}"

# Ensure URL has https:// prefix
if [[ ! "$APP_URL" =~ ^https?:// ]]; then
  APP_URL="https://${APP_URL}"
fi

CRON_SECRET="${CRON_SECRET}"

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET environment variable is not set"
  exit 1
fi

echo "Running daily tasks at $(date)"
echo "Calling: ${APP_URL}/api/cron/daily-tasks"

# Call the cron endpoint
response=$(curl -s -w "\n%{http_code}" -X POST "${APP_URL}/api/cron/daily-tasks" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json")

# Extract HTTP status code (last line)
http_code=$(echo "$response" | tail -n1)
# Extract body (everything except last line)
body=$(echo "$response" | sed '$d')

echo "Response (HTTP ${http_code}):"
echo "$body"

if [ "$http_code" -eq 200 ]; then
  echo "Daily tasks completed successfully"
  exit 0
else
  echo "Daily tasks failed with HTTP ${http_code}"
  exit 1
fi
