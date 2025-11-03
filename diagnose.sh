#!/bin/bash

echo "=== Money Intelligence Deployment Diagnostics ==="
echo ""

echo "1. Checking Docker containers status:"
docker ps -a
echo ""

echo "2. Checking if services are listening on expected ports:"
echo "  Backend (should be 127.0.0.1:8000):"
netstat -tlnp | grep :8000 || ss -tlnp | grep :8000
echo "  Frontend (should be 127.0.0.1:3000):"
netstat -tlnp | grep :3000 || ss -tlnp | grep :3000
echo ""

echo "3. Checking Nginx status:"
systemctl status nginx --no-pager
echo ""

echo "4. Testing backend connection from localhost:"
curl -v http://127.0.0.1:8000/api/health 2>&1 | head -20
echo ""

echo "5. Testing frontend connection from localhost:"
curl -I http://127.0.0.1:3000 2>&1 | head -10
echo ""

echo "6. Checking Nginx configuration:"
nginx -t
echo ""

echo "7. Recent Nginx error logs:"
tail -30 /var/log/nginx/error.log
echo ""

echo "8. Recent Docker logs (backend):"
docker logs --tail 50 $(docker ps -q -f name=backend) 2>&1 || echo "No backend container found"
echo ""

echo "9. Recent Docker logs (frontend):"
docker logs --tail 50 $(docker ps -q -f name=frontend) 2>&1 || echo "No frontend container found"
echo ""

echo "10. Checking if .env file exists:"
if [ -f .env ]; then
    echo ".env file exists"
    echo "Number of lines in .env: $(wc -l < .env)"
else
    echo "WARNING: .env file not found!"
fi
echo ""

echo "=== End of diagnostics ==="
