#!/usr/bin/env node
/**
 * Generates run-migrations.sh with the current Prisma schema embedded.
 * Run this after changing prisma/schema.prisma, or it runs automatically during build.
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const outputPath = path.join(__dirname, 'run-migrations.sh');

const schema = fs.readFileSync(schemaPath, 'utf8');

const script = `#!/bin/bash
# Database Migration Script for Azure PostgreSQL Flexible Server
# AUTO-GENERATED - Do not edit directly. Run: node scripts/generate-migration-script.js
#
# This script is designed to run from a jump box VM in the same VNet as the database.
# It installs Node.js, creates the Prisma schema, and runs migrations.
#
# Usage:
#   1. SSH into your jump box VM
#   2. Copy this entire script and paste it into a file: nano run-migrations.sh
#   3. Make executable: chmod +x run-migrations.sh
#   4. Run: ./run-migrations.sh "postgresql://user:pass@host:5432/dbname?sslmode=require"
#
# Options:
#   --accept-data-loss    Allow destructive schema changes (drops columns/tables)

set -e

# Check for DATABASE_URL argument
if [ -z "$1" ]; then
    echo "Usage: $0 <DATABASE_URL> [--accept-data-loss]"
    echo ""
    echo "Example:"
    echo "  $0 \\"postgresql://user:password@server.postgres.database.azure.com:5432/dbname?sslmode=require\\""
    echo ""
    echo "Options:"
    echo "  --accept-data-loss    Allow destructive schema changes"
    exit 1
fi

DATABASE_URL="$1"
ACCEPT_DATA_LOSS=""

# Check for --accept-data-loss flag
if [ "$2" = "--accept-data-loss" ]; then
    ACCEPT_DATA_LOSS="--accept-data-loss"
    echo "WARNING: --accept-data-loss is enabled. Destructive changes will be applied."
fi

echo "=== Accessible Map Agent - Database Migration ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed: $(node --version)"
else
    echo "Node.js found: $(node --version)"
fi

# Create temp directory
WORK_DIR=$(mktemp -d)
echo "Working directory: $WORK_DIR"
cd "$WORK_DIR"

# Create prisma directory and schema
mkdir -p prisma

echo "Creating Prisma schema..."
cat > prisma/schema.prisma << 'SCHEMA_EOF'
${schema}SCHEMA_EOF

echo "Schema created."

# Run prisma db push
echo ""
echo "Running database migration..."
echo "This will sync the schema with the database."
echo ""

# Use Prisma 5.x to match the project version (Prisma 7 has breaking changes)
DATABASE_URL="$DATABASE_URL" npx prisma@5 db push $ACCEPT_DATA_LOSS

echo ""
echo "=== Migration complete! ==="

# Cleanup
cd /
rm -rf "$WORK_DIR"
echo "Cleaned up temporary files."
`;

fs.writeFileSync(outputPath, script, { mode: 0o755 });
console.log('Generated scripts/run-migrations.sh with current schema');
