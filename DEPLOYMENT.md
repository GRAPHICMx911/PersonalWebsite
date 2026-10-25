# Permanent 24/7 Cloud Hosting Guide (Multi-Year Production)

This guide provides complete instructions for permanent, long-term cloud hosting for your **Personal Portfolio, Design Showcase & Admin CMS** on **Netlify**.

The architecture uses **Netlify** for edge CDN + Python serverless functions, and **Neon.tech** for managed Cloud PostgreSQL. Both platforms are **100% free**, offer **permanent URLs that never expire**, include **automatic SSL certificates**, and **do not shut down or sleep**.

---

## Architecture Overview

| Component | Platform | Configuration |
| :--- | :--- | :--- |
| **Public Site** | Netlify Global Edge CDN | `frontend/` directory (HTML, CSS, JS, Assets) |
| **Admin CMS** | Netlify Global Edge CDN | `frontend/admin/` dashboard, login & managers |
| **REST API** | Netlify Python Functions | `netlify/functions/api.py` (FastAPI + Mangum) |
| **Database** | Neon.tech Cloud PostgreSQL | Managed Postgres with automated connection pooling |
| **Routing / Rewrites** | `netlify.toml` + `_redirects` | `/api/*` proxies to serverless function, `/admin` redirects to dashboard |

---

## Deploying to Netlify (Step-by-Step)

### Step 1: Obtain Your Neon PostgreSQL Database URL
If you haven't already:
1. Go to [Neon.tech](https://neon.tech) and sign up with your GitHub account.
2. Create a project named `personal-website` (select your preferred region, e.g. Frankfurt, US East, or Singapore).
3. Copy your **Connection String**. It looks like:
   ```text
   postgresql://username:password@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

### Step 2: Deploy to Netlify
1. Go to [Netlify.com](https://www.netlify.com) and log in with your **GitHub** account.
2. In your Netlify dashboard, click **Add new site** $\rightarrow$ **Import an existing project**.
3. Select **GitHub** and choose your **`PersonalWebsite`** repository (`GRAPHICMx911/PersonalWebsite`).
4. In the **Site configuration** screen:
   - **Branch to deploy**: `main`
   - **Base directory**: Leave blank (root of repo)
   - **Package directory**: Leave blank
   - **Build command**: Leave blank (our pre-configured `netlify.toml` handles configuration)
   - **Publish directory**: `frontend` (pre-configured in `netlify.toml`)
   - **Functions directory**: `netlify/functions` (pre-configured in `netlify.toml`)
5. Click **Add environment variables** and enter the following three variables:

| Variable Name | Recommended Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | *(Your Neon PostgreSQL connection string)* | Enables live PostgreSQL storage |
| `JWT_SECRET_KEY` | `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2` | For secure admin JWT auth |
| `SECRET_KEY` | `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2` | App secret key |
| `PYTHON_VERSION` | `3.12` | Python runtime version |

6. Click **Deploy site**!

---

### Step 3: Your Live Production URLs on Netlify

In about 60–90 seconds, Netlify will build and deploy your application:
- **Public Website**: `https://<your-site-name>.netlify.app/`
- **Admin CMS Dashboard**: `https://<your-site-name>.netlify.app/admin` (or `/admin/dashboard.html`)
- **Admin CMS Login**: `https://<your-site-name>.netlify.app/admin/login.html`
- **Interactive API Documentation**: `https://<your-site-name>.netlify.app/docs`

*(You can customize your site name for free under Site configuration $\rightarrow$ Change site name, e.g. `design-lyricist.netlify.app`, or bind your custom domain).*

---

## Admin CMS Credentials
- **Username / Email**: `admin` or `muneeb03022309111@gmail.com`
- **Password**: `Admin@123456`
- **Direct Login URL**: `https://<your-site-name>.netlify.app/admin/login.html`

---

## Alternative Deployments Supported

The repository continues to support alternative deployments if needed:
- **Vercel**: Configuration preserved in `vercel.json` and `api/index.py`.
- **Hugging Face Spaces (Docker)**: Configuration preserved in `Dockerfile`.
- **Local Development**: Run `venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000` with Live Server on `frontend/`.
