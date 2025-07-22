#!/bin/bash

echo "🏨 Hotel Audit Management System - Full Stack Startup"
echo "====================================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "✅ Virtual environment found"
fi

# Start PostgreSQL if not running
echo "🗄️  Starting PostgreSQL..."
sudo service postgresql start
sleep 2

# Function to start backend
start_backend() {
    echo "🐍 Starting Python Backend (FastAPI + Gemini AI)..."
    cd python_backend
    source ../venv/bin/activate
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..
    echo "✅ Backend started with PID: $BACKEND_PID on port 8000"
}

# Function to start frontend
start_frontend() {
    echo "⚛️  Starting React Frontend..."
    npm run dev:frontend &
    FRONTEND_PID=$!
    echo "✅ Frontend started with PID: $FRONTEND_PID on port 5173"
}

# Start both services
start_backend
sleep 4
start_frontend
sleep 3

echo ""
echo "🎉 System startup complete!"
echo "============================="
echo ""
echo "🌐 Access your application:"
echo "  • Frontend (React):     http://localhost:5173"
echo "  • AI Demo Page:         http://localhost:5173/ai-demo"
echo "  • Backend API:          http://localhost:8000"
echo "  • API Documentation:    http://localhost:8000/docs"
echo "  • Integration Test:     file://$(pwd)/test_integration.html"
echo ""
echo "🔐 Updated Test Credentials:"
echo "  • Admin:     admin / admin123"
echo "  • Auditor:   sarah.johnson / auditor123"
echo "  • Reviewer:  lisa.thompson / reviewer123"
echo "  • Corporate: raj.patel / corporate123"
echo "  • Hotel GM:  priya.sharma / hotelgm123"
echo ""
echo "🤖 AI Features Ready:"
echo "  • Google Gemini API integrated"
echo "  • Photo analysis capabilities"
echo "  • Automated report generation"
echo "  • Smart scoring suggestions"
echo ""
echo "🔧 Architecture:"
echo "  • Frontend: React + TypeScript + Vite + TailwindCSS"
echo "  • Backend:  Python + FastAPI + SQLAlchemy + PostgreSQL"
echo "  • AI:       Google Gemini Pro + Vision models"
echo "  • Auth:     JWT tokens + Role-based access control"
echo ""
echo "💡 To stop all services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📋 Next Steps:"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Login with any demo credentials"
echo "  3. Explore the AI Demo page for Gemini features"
echo "  4. Check the integration test page for system status"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Services stopped. Goodbye!'; exit 0" SIGINT

# Keep script running
wait
