#!/usr/bin/env bash
# Quick restart of dev + realtime services. Call this right before any verification.
pkill -f "next-server" 2>/dev/null
pkill -f "next dev -p 3000" 2>/dev/null
pkill -f "realtime-service/index" 2>/dev/null
pkill -f "start-services.sh" 2>/dev/null
sleep 1

cd /home/z/my-project/mini-services/realtime-service
setsid bash -c 'exec bun --hot index.ts > /home/z/my-project/realtime.log 2>&1' < /dev/null &

cd /home/z/my-project
setsid bash -c 'exec node /home/z/my-project/node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1' < /dev/null &

# Give them time to boot
sleep 7
echo "=== ps ==="
ps aux | grep -E "next-server|realtime-service/index" | grep -v grep
echo "=== dev.log ==="
tail -3 /home/z/my-project/dev.log
echo "=== realtime.log ==="
tail -3 /home/z/my-project/realtime.log
