#!/bin/bash
set -e

echo "Starting Accessible Map Agent..."

# Start the Next.js server (standalone mode)
# Note: Database migrations must be run manually via a jump box or VM in the VNet
# See the "Database Migrations" section of README.md
echo "Starting Next.js server..."
exec node server.js
