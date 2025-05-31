# Platform Final 2 - Windows Setup Guide

## Quick Start Instructions

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python server.py
```
The backend will run on: http://localhost:8001

### 2. Frontend Setup (Open a new terminal)
```bash
# Navigate to frontend directory  
cd frontend

# Install Node.js dependencies
yarn install

# Start the React development server
yarn start
```
The frontend will run on: http://localhost:3000

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

### 4. Testing
1. Open http://localhost:3000 in your browser
2. Check browser console for successful API calls
3. Visit http://localhost:8001/docs to test API endpoints directly

### Troubleshooting
- Make sure MongoDB service is running
- Ensure ports 3000 and 8001 are not in use by other applications
- Check Windows Firewall settings if you have connection issues
