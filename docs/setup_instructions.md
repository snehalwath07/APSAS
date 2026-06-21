# APSAS 2.0 — Installation & Deployment Guide

This document describes how to configure, run, and deploy the AI Powered Smart Public Alert & Safety System (APSAS) 2.0.

---

## 1. Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- SQLite (default) or PostgreSQL

### A. Backend Setup
1. Open a terminal in the root directory.
2. Initialize and activate the virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/MacOS:
   source .venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Train the ML Risk Prediction model on synthetic historical data:
   ```bash
   python ml_models/risk_predictor.py
   ```
5. Seed the database with mock records (users, incidents, SOS requests, dispatch teams):
   ```bash
   python database/seed_db.py
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   The backend will run on `http://127.0.0.1:8000`. You can access automated Swagger documentation at `http://127.0.0.1:8000/docs`.

### B. Frontend Setup
1. Open a separate terminal in the `frontend/` directory.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   Open the browser at the logged address (usually `http://localhost:5173`).

---

## 2. Testing Credentials

Use the following seeded credentials to log in:

- **Admin Account**:
  - Email: `admin@apsas.city`
  - Password: `password123`
- **Emergency Operator**:
  - Email: `operator@apsas.city`
  - Password: `password123`
- **Citizen / User**:
  - Email: `citizen@apsas.city`
  - Password: `password123`

---

## 3. Production Deployment

### A. Database (PostgreSQL)
Provision a PostgreSQL database using a hosting provider like **Supabase**, **Neon**, or **Render Database**.
Copy the Connection String / Database URL.

### B. Backend Deployment (Render)
1. Sign up on [Render.com](https://render.com).
2. Create a new **Web Service** connected to your code repository.
3. Configure settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt && python ml_models/risk_predictor.py`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables**:
   - `DATABASE_URL`: `postgresql://user:pass@host:port/dbname` (your PostgreSQL connection string)
   - `JWT_SECRET`: a secure random string (e.g. `supersecuretoken123456!`)
   - `UPLOAD_DIR`: `uploads`

### C. Frontend Deployment (Vercel)
1. Sign up on [Vercel.com](https://vercel.com).
2. Import your repository and select the `frontend/` directory as the project root.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variable**:
   - `VITE_API_URL`: The URL of your backend service running on Render (e.g. `https://apsas-backend.onrender.com/api/v1`)
5. Click **Deploy**. Vercel will build and host your production dashboard!
