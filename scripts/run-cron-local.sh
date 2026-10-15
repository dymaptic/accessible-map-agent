#!/bin/bash
# Local development script for running cron jobs
# Usage: ./scripts/run-cron-local.sh [daily|hourly]
#
# Arguments:
#   daily  - Run daily tasks (quota resets, expirations, cleanups, reminders)
#   hourly - Run hourly tasks (webhook queue processing)
#   (no arg) - Defaults to daily
#
# Prerequisites:
# 1. Dev server must be running (npm run dev)
# 2. CRON_SECRET must be set in your .env file

set -e

# Load .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET}"

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET is not set"
  echo "Add CRON_SECRET to your .env file (any random string works for local dev)"
  exit 1
fi

# Determine which cron to run (default: daily)
CRON_TYPE="${1:-daily}"

case "$CRON_TYPE" in
  daily)
    ENDPOINT="/api/cron/daily-tasks"
    DESCRIPTION="Daily tasks (quotas, expirations, cleanups, reminders)"
    ;;
  hourly)
    ENDPOINT="/api/cron/hourly-tasks"
    DESCRIPTION="Hourly tasks (webhook queue processing)"
    ;;
  *)
    echo "Usage: $0 [daily|hourly]"
    echo "  daily  - Run daily tasks (default)"
    echo "  hourly - Run hourly tasks"
    exit 1
    ;;
esac

echo "========================================"
echo "Running ${CRON_TYPE} cron job locally"
echo "========================================"
echo "URL: ${APP_URL}${ENDPOINT}"
echo "Description: ${DESCRIPTION}"
echo "Time: $(date)"
echo ""

# Call the cron endpoint
response=$(curl -s -w "\n%{http_code}" -X POST "${APP_URL}${ENDPOINT}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json")

# Extract HTTP status code (last line)
http_code=$(echo "$response" | tail -n1)
# Extract body (everything except last line)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: ${http_code}"
echo ""
echo "Response:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ]; then
  echo "========================================"
  echo "${CRON_TYPE} cron job completed successfully"
  echo "========================================"
  exit 0
else
  echo "========================================"
  echo "${CRON_TYPE} cron job failed!"
  echo "========================================"
  exit 1
fi
