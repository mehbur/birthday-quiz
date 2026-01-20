# Birthday Quiz - Deployment Guide

## Quick Deploy to Render.com

### 1. Server Deployment

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repo (or use "Deploy from Git URL")
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `ALLOWED_ORIGINS` = (your client URL, e.g., `https://birthday-quiz-client.onrender.com`)

### 2. Client Deployment

1. Click "New +" → "Static Site"
2. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_SERVER_URL` = (your server URL, e.g., `https://birthday-quiz-server.onrender.com`)

### 3. Update CORS

After both are deployed, update the server's `ALLOWED_ORIGINS` env var with the client URL.

## Local Testing

```bash
# Server
cd server
npm install
npm run dev

# Client (another terminal)
cd client
npm install
npm run dev
```

Open http://localhost:5173
