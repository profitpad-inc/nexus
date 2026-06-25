#!/usr/bin/env bash
# Start Nexus ERP (both backend and frontend)

echo "Starting Nexus ERP..."

# Backend (FastAPI) on :8000
(cd backend && python -m uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# Frontend (Next.js) on :3000
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
