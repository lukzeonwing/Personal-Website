#!/bin/bash

# Restart script for Jarvis website services
# This script restarts both the backend API and frontend services

set -e  # Exit on any error

echo "🔄 Restarting Jarvis Website Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to restart a service
restart_service() {
    local service_name=$1
    echo -e "${BLUE}Restarting ${service_name}...${NC}"
    
    if sudo systemctl restart "${service_name}"; then
        echo -e "${GREEN}✓ ${service_name} restarted successfully${NC}"
        
        # Check status
        if sudo systemctl is-active --quiet "${service_name}"; then
            echo -e "${GREEN}✓ ${service_name} is running${NC}"
        else
            echo -e "${RED}✗ ${service_name} failed to start${NC}"
            sudo systemctl status "${service_name}" --no-pager -l
            return 1
        fi
    else
        echo -e "${RED}✗ Failed to restart ${service_name}${NC}"
        return 1
    fi
    echo ""
}

# Restart backend
restart_service "jarvis-website"

# Restart frontend
restart_service "jarvis-website-frontend"

echo ""
echo -e "${GREEN}🎉 All services restarted successfully!${NC}"
echo ""
echo "Service Status:"
sudo systemctl status jarvis-website jarvis-website-frontend --no-pager -l | head -20

echo ""
echo "To view logs:"
echo "  Backend:  sudo journalctl -u jarvis-website -f"
echo "  Frontend: sudo journalctl -u jarvis-website-frontend -f"
