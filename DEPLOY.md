# Deployment Guide — ConnectSphere

This document outlines a recommended deployment flow using Render (backend) + Vercel (frontend) and MongoDB Atlas.

## 1) Prepare repository
- Ensure `frontend` and `backend` folders are committed.
- Add any `.env` files locally (do NOT commit secrets).

## 2) Backend — Render
1. Push your repo to GitHub.
2. In Render, create a new **Web Service** and connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add Environment Variables in Render (Dashboard > Environment):
   - `PORT=5000`
   - `MONGODB_URI=your_mongodb_atlas_connection_string`
   - `JWT_SECRET=your_super_secret_key`
   - `NODE_ENV=production`
   - Optional: `FRONTEND_URLS=https://connectsphere.vercel.app` (comma-separated if multiple)
   - Optional: `REDIS_URL`, `ENABLE_REDIS=true` if using Redis
7. Deploy. After successful deployment your API will be available at a Render URL like `https://connectsphere-api.onrender.com`.
8. Verify: `https://<your-render-url>/api/health` or `/api` endpoints.

## 3) Frontend — Vercel
1. In `frontend/.env.example` include the placeholder:
   - `REACT_APP_API_URL=https://connectsphere-api.onrender.com/api`
2. In Vercel, import the GitHub repo and set the Root Directory to `frontend`.
3. Framework: Create React App
4. Add Environment Variables in Vercel (Settings > Environment Variables):
   - `REACT_APP_API_URL=https://connectsphere-api.onrender.com/api`
   - `REACT_APP_SOCKET_URL=https://connectsphere-api.onrender.com`
   - Also add `REACT_APP_NODE_ENV=production` if needed
5. Deploy. After deploy you’ll get a URL like `https://connectsphere.vercel.app`.

## 4) CORS
Backend uses `FRONTEND_URLS` (comma-separated) or `FRONTEND_URL` to configure CORS for Express and Socket.io.
- Example: `FRONTEND_URLS=https://connectsphere.vercel.app,https://staging.connectsphere.vercel.app`
- For quick testing you may temporarily set `app.use(cors())` (not recommended in production).

## 5) MongoDB Atlas
- Create a cluster and get connection string.
- Add IP access: set Network Access to `0.0.0.0/0` (or restrict to specific IPs).
- Use the connection string in `MONGODB_URI` for Render.

## 6) Local Development
- Create `frontend/.env.local`:
  ```
  REACT_APP_API_URL=http://localhost:5000/api
  REACT_APP_SOCKET_URL=http://localhost:5000
  ```
- Create `backend/.env` (copy from `backend/.env.example`) and fill values.
- Start backend: `cd backend && npm run dev`
- Start frontend: `cd frontend && npm start`

## 7) Troubleshooting
- If frontend cannot reach API in production, ensure `REACT_APP_API_URL` points to the correct backend URL and CORS allows the frontend origin(s).
- Check Render/Vercel deploy logs for build/runtime errors.
- Verify MongoDB Atlas IP access and credentials.

---
If you want, I can also create GitHub Action workflow files for automated deploys or add a small health-check script you can run after pushing changes.
