#!/bin/sh
# start.sh
echo "Applying database schemas..."
npx --no-install prisma db push --accept-data-loss || npx prisma db push --accept-data-loss


echo "Seeding fixtures..."
node prisma/seed.js

echo "Starting Next.js..."
node server.js
