# Tejas AI - Frontend (Vercel Deploy)

This is the standalone frontend React application for **Tejas AI**, ready to deploy directly on **Vercel** or **Cloudflare Pages**.

## 🚀 How to Deploy on Vercel

1. **Create a GitHub Repo** for this frontend:
   - Push the files inside this `frontend/` folder to GitHub.
2. **Go to [Vercel.com](https://vercel.com)**:
   - Click **"Add New Project"** and select your frontend repo.
   - Framework Preset: **Vite**
   - Root Directory: `./` (or leave default)
3. **Set Environment Variables in Vercel:**
   - `VITE_BACKEND_URL`: Your Railway backend URL (e.g. `https://tejas-backend.up.railway.app`)
   - `VITE_FIREBASE_API_KEY`: Your Firebase Web API key
   - `VITE_FIREBASE_AUTH_DOMAIN`: `your-app.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `your-project-id`
   - `VITE_FIREBASE_APP_ID`: `your-app-id`
4. Click **"Deploy"**!
5. Add your Vercel domain to **Firebase Console -> Authentication -> Settings -> Authorized Domains** so Google Login works seamlessly.
