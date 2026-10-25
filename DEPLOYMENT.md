# Permanent 24/7 Cloud Hosting Guide (Multi-Year Production)

This guide details deployment options for your **Personal Portfolio & Admin CMS**, including **Netlify** for the global edge frontend (`muneebahmad.netlify.app`), **Vercel + Neon** for serverless backend API execution, and **Hugging Face Spaces** for Docker hosting.

---

## Netlify Production Deployment (`muneebahmad.netlify.app`)

### Live Production URLs
- **Public Site**: [**`https://muneebahmad.netlify.app`**](https://muneebahmad.netlify.app)
- **Admin CMS Dashboard**: [**`https://muneebahmad.netlify.app/admin`**](https://muneebahmad.netlify.app/admin) (or `/admin/dashboard.html`)
- **Admin Direct Login**: [**`https://muneebahmad.netlify.app/admin/login.html`**](https://muneebahmad.netlify.app/admin/login.html)
- **API Proxy**: Automatically rewrites `/api/*` to the live backend server with 200 reverse-proxy streaming.

### Step-by-Step Setup on Netlify
1. Go to [Netlify.com](https://app.netlify.com) and log in with your GitHub account.
2. Click **Add new site** $\rightarrow$ **Import an existing project**.
3. Choose **GitHub** and select your repository: **`PersonalWebsite`** (or `GRAPHICMx911/PersonalWebsite`).
4. In the build settings:
   - **Base directory**: Leave blank or set to `/`
   - **Build command**: Leave blank
   - **Publish directory**: `frontend` *(configured automatically by `netlify.toml`)*
5. Click **Deploy PersonalWebsite**.
6. **Rename Site to `muneebahmad`**:
   - Go to **Site configuration** $\rightarrow$ **General** $\rightarrow$ **Site details**.
   - Click **Change site name**.
   - Enter **`muneebahmad`** and save.
   - Your site will instantly be live at **`https://muneebahmad.netlify.app`**!

---

## Comparison of Recommended Hosts

| Feature | Netlify (Edge Frontend + Admin) | Vercel + Neon (Full-Stack + API) | Hugging Face Spaces (Docker) |
| :--- | :--- | :--- | :--- |
| **Site URL** | **`muneebahmad.netlify.app`** | `personal-website-phi-three-11.vercel.app` | `*.hf.space` |
| **Uptime & Lifespan** | **Permanent (Multi-Year)** | **Permanent (Multi-Year)** | **Permanent (Multi-Year)** |
| **Sleeping / Cold Starts**| **None** (Global Edge CDN) | **None** (Serverless Edge) | **None** (24/7 Container) |
| **Database** | Proxied to Neon PostgreSQL | Neon.tech Cloud PostgreSQL | Built-in SQLite |
| **Cost** | 100% Free Forever | 100% Free Forever | 100% Free Forever |
| **Credit Card Needed?** | **No** | **No** | **No** |
| **Custom Subdomain** | `muneebahmad.netlify.app` | `*.vercel.app` | `*.hf.space` |

---

## Option 1: Vercel + Neon Cloud PostgreSQL (Backend API & Database)

Vercel provides the serverless Python runtime powering the REST API endpoints and Neon Cloud PostgreSQL.

### Step 1: Cloud Database on Neon
1. Go to [Neon.tech](https://neon.tech) and click **Sign Up** (with GitHub).
2. Click **Create Project** $\rightarrow$ `muneeb-portfolio`.
3. Copy your **Connection String**:
   ```text
   postgresql://muneeb_owner:AbCdEf123456@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com) and import **`PersonalWebsite`**.
2. Add these Environment Variables:
   - `DATABASE_URL`: *(Your Neon connection string)*
   - `JWT_SECRET_KEY`: `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2`
   - `SECRET_KEY`: `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2`
3. Click **Deploy**.

---

## Option 2: Hugging Face Spaces (Dedicated 24/7 Docker Server)

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Name: `personal-portfolio` | SDK: **Docker** $\rightarrow$ **Blank** | Hardware: Free.
3. Push your repository:
   ```bash
   git remote add hf https://huggingface.co/spaces/<your-username>/personal-portfolio
   git push -u hf main:main --force
   ```

---

## Permanent Admin Credentials
- **Admin Email / Username**: `admin` or `muneeb03022309111@gmail.com`
- **Password**: `Admin@123456`
- **Netlify Direct Login URL**: `https://muneebahmad.netlify.app/admin/login.html`
- **Netlify Admin Dashboard**: `https://muneebahmad.netlify.app/admin/dashboard.html`
