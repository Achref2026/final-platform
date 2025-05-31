# Platform Final 2 - Windows Setup Guide (Corrected)

## Quick Start Instructions

### 1. Backend Setup
```bash
# Navigate to backend directory (if not already there)
cd backend

# Install Python dependencies
py -m pip install -r requirements.txt

# Start the FastAPI server
py server.py
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

### Expected Output:
- Backend: Should show "Application startup complete" and "Uvicorn running on http://0.0.0.0:8001"
- Frontend: Should automatically open browser to http://localhost:3000

### Troubleshooting
- Make sure MongoDB service is running
- Ensure ports 3000 and 8001 are not in use by other applications
- Use `py` command instead of `python` on your Windows setup
