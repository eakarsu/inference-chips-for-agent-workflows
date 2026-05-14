#!/bin/bash


# Kill existing processes on ports
echo "Clearing ports 3011 and 5175..."
lsof -ti:3011 | xargs kill -9 2>/dev/null || true
lsof -ti:5175 | xargs kill -9 2>/dev/null || true

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_NAME="inference_chips_db"
DB_USER="${PGUSER:-postgres}"

echo "Setting up database: $DB_NAME..."
psql -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"

echo "Running schema..."
psql -U "$DB_USER" -d "$DB_NAME" -f backend/db/schema.sql

echo "Running seed..."
psql -U "$DB_USER" -d "$DB_NAME" -f backend/db/seed.sql

echo "Installing backend dependencies..."
cd backend && npm install && cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "Starting backend on port 3011..."
cd backend && node server.js &
BACKEND_PID=$!
cd ..

echo "Starting frontend on port 5175..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "ChipProfiler is running!"
echo "  Frontend: http://localhost:5175"
echo "  Backend:  http://localhost:3011"
echo "  Login:    admin@demo.com / demo123"
echo ""
echo "Press Ctrl+C to stop all services"

cleanup() {
  echo "Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM
wait
