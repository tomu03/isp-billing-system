#!/bin/bash

# ISP Billing System — Quick Start Setup Script
# Run this script to automatically set up and start the entire system

set -e  # Exit on error

echo "🚀 SwiftNet Billing System — Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v16 or later.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION}${NC}"
echo ""

# Setup Backend
echo -e "${YELLOW}Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --no-audit --no-fund > /dev/null 2>&1
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

cd ..
echo ""

# Setup Frontend
echo -e "${YELLOW}Setting up Frontend...${NC}"
cd frontend

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
    echo -e "${GREEN}✓ .env.local file created${NC}"
else
    echo -e "${GREEN}✓ .env.local file already exists${NC}"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --no-audit --no-fund > /dev/null 2>&1
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

cd ..
echo ""

# Instructions
echo -e "${GREEN}===================================="
echo "✅ Setup Complete!"
echo "====================================${NC}"
echo ""
echo "📝 Next steps:"
echo ""
echo "1️⃣  Start the backend (Terminal 1):"
echo -e "   ${YELLOW}cd backend && npm start${NC}"
echo ""
echo "2️⃣  Start the frontend (Terminal 2):"
echo -e "   ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "3️⃣  Open your browser:"
echo -e "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "🔑 Demo Login:"
echo "   Email: admin@ispbilling.com"
echo "   Password: password123"
echo ""
echo "📚 Documentation:"
echo "   - README.md — Overview & features"
echo "   - API_DOCS.md — API reference"
echo "   - SCHEMA.md — Database structure"
echo ""
echo -e "${GREEN}Happy billing! 🎉${NC}"
