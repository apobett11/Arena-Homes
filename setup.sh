#!/bin/bash
# Arena Homes - First-Time Setup Script (Linux/Mac)

echo "========================================"
echo "Arena Homes - First-Time Setup"
echo "========================================"
echo ""
echo "This script will:"
echo "1. Install all dependencies"
echo "2. Set up environment files"
echo "3. Initialize database"
echo "4. Seed test data"
echo ""
read -p "Press Enter to continue..."

# Step 1: Install backend dependencies
echo ""
echo "[1/6] Installing backend dependencies..."
cd arena-server
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install backend dependencies"
        exit 1
    fi
else
    echo "Backend dependencies already installed"
fi
cd ..

# Step 2: Install frontend dependencies
echo ""
echo "[2/6] Installing frontend dependencies..."
cd arena-web
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "Frontend dependencies already installed"
fi
cd ..

# Step 3: Set up backend .env
echo ""
echo "[3/6] Setting up backend environment..."
if [ ! -f "arena-server/.env" ]; then
    cp "arena-server/.env.example" "arena-server/.env"
    echo "[IMPORTANT] Please edit arena-server/.env and configure:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET (generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    echo "  - REFRESH_TOKEN_SECRET (generate a different secret)"
    echo ""
    
    # Try to open in default editor
    if command -v nano &> /dev/null; then
        read -p "Press Enter to edit .env file with nano..."
        nano "arena-server/.env"
    elif command -v vim &> /dev/null; then
        read -p "Press Enter to edit .env file with vim..."
        vim "arena-server/.env"
    else
        echo "Please manually edit arena-server/.env before continuing"
        read -p "Press Enter after you've configured the .env file..."
    fi
else
    echo "Backend .env already exists"
fi

# Step 4: Set up frontend .env.local
echo ""
echo "[4/6] Setting up frontend environment..."
if [ ! -f "arena-web/.env.local" ]; then
    cp "arena-web/.env.example" "arena-web/.env.local"
    echo "Frontend .env.local created"
else
    echo "Frontend .env.local already exists"
fi

# Step 5: Initialize database
echo ""
echo "[5/6] Initializing database schema..."
cd arena-server
npm run db:push
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to initialize database"
    echo "Please check your DATABASE_URL in .env"
    cd ..
    exit 1
fi
cd ..

# Step 6: Seed test data
echo ""
echo "[6/6] Seeding test data..."
cd arena-server
npm run seed:minimal
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to seed database"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "You can now start the development servers:"
echo "  Option 1: ./start-dev.sh"
echo "  Option 2: Run manually:"
echo "    Terminal 1: cd arena-server && npm run dev"
echo "    Terminal 2: cd arena-web && npm run dev"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000/api"
echo ""
echo "Test Login:"
echo "  Email:    admin@arenahomes.test"
echo "  Password: Admin#1234"
echo ""
