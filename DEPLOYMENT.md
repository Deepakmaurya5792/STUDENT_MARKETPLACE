# StudentMarket — Deployment Guide

This project is configured for **universal deployment**. You can deploy it using any of the following methods:

---

## Method 1: All-in-One Deployment on Render (Recommended ⭐)
*Both the Node.js/Socket.IO backend and the pre-built React frontend run together on a single free Render Web Service. No CORS issues, instant WebSockets.*

### Steps:
1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare production deployment"
   git push origin main
   ```
2. **Log into [Render.com](https://render.com):**
   - Click **New +** → **Blueprint** (or **Web Service**).
   - Connect your GitHub repository.
   - Render will automatically detect the [render.yaml](file:///c:/Users/deepa/OneDrive/Desktop/Student_Market_Place/render.yaml) file!
   
3. **If configuring manually as a Web Service:**
   - **Environment:** `Node`
   - **Build Command:** `npm run postinstall && npm run build`
   - **Start Command:** `npm start`
   
4. **Add Environment Variables in Render Dashboard:**
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: *Your MongoDB Atlas connection URI*
   - `JWT_SECRET`: *Your secure JWT secret key*
   - `CLOUDINARY_CLOUD_NAME`: *Your Cloudinary cloud name*
   - `CLOUDINARY_API_KEY`: *Your Cloudinary API key*
   - `CLOUDINARY_API_SECRET`: *Your Cloudinary API secret*
   - `CLIENT_URL`: `*` (or leave empty to allow same-origin)

5. Click **Create Web Service**. Your app will be live at `https://student-marketplace-xxxx.onrender.com`!

---

## Method 2: Split Deployment (Frontend on Vercel + Backend on Render/Railway)

### A. Deploy Backend on Render / Railway:
1. Set Root Directory to `server` (or run root with `startCommand: npm start`).
2. Set Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`).
3. Set `CLIENT_URL` to your Vercel URL (e.g. `https://student-marketplace.vercel.app`).
4. Note your backend URL (e.g. `https://studentmarket-api.onrender.com`).

### B. Deploy Frontend on Vercel:
1. Log into [Vercel.com](https://vercel.com) and import your Git repository.
2. In Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client` (or use root with included [vercel.json](file:///c:/Users/deepa/OneDrive/Desktop/Student_Market_Place/vercel.json))
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variables:
   - `VITE_API_URL`: `https://studentmarket-api.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://studentmarket-api.onrender.com`
4. Click **Deploy**. Vercel will build and serve the frontend with SPA rewrites handled by [client/vercel.json](file:///c:/Users/deepa/OneDrive/Desktop/Student_Market_Place/client/vercel.json).

---

## Method 3: Containerized Deployment (Docker)

To run the complete production stack inside Docker:

```bash
# 1. Ensure .env has your MONGODB_URI and JWT_SECRET
# 2. Build and run container
docker compose up --build -d
```

The container will:
- Build the Vite frontend in Stage 1
- Install production-only backend packages in Stage 2
- Run the unified Express + Socket.IO server on port `5000`
- Access your live app at `http://localhost:5000`
