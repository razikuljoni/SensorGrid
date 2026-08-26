#!/usr/bin/env bash
# Starts the Next.js dev server and the realtime socket.io mini-service together
# so they share the same process group / session and survive subsequent shell calls.
set -e
cd /home/z/my-project

# Kill any stale instances
pkill -f "next-server" 2>/dev/null || true
pkill -f "realtime-service/index" 2>/dev/null || true
pkill -f "next dev -p 3000" 2>/dev/null || true
sleep 1

# Start realtime mini-service (port 3003) — direct bun, no tee
cd /home/z/my-project/mini-services/realtime-service
exec bun --hot index.ts > /home/z/my-project/realtime.log 2>&1 &
REALTIME_PID=$!
echo "realtime pid=$REALTIME_PID"

# Start Next.js dev server (port 3000) — direct next, no tee (avoids SIGPIPE death)
cd /home/z/my-project
node /home/z/my-project/node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
NEXT_PID=$!
echo "next pid=$NEXT_PID"

# Wait for both — keeps the script alive
wait
