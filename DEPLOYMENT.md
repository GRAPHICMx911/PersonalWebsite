# Permanent 24/7 Cloud Hosting Guide (Multi-Year Production)

This guide provides permanent, long-term cloud hosting for your **Personal Portfolio, Tailored CV Showcase & Admin CMS** without using Koyeb or Render.

Both platforms below are **100% free**, offer **permanent URLs that never expire**, have **automatic SSL certificates**, and **do not shut down or delete your database**.

---

## Comparison of Recommended Permanent Hosts

| Feature | Option 1: Vercel + Neon (Recommended) | Option 2: Hugging Face Spaces (Docker) |
| :--- | :--- | :--- |
| **Uptime & Lifespan** | **Permanent (Multi-Year)** | **Permanent (Multi-Year)** |
| **Sleeping / Cold Starts** | **None** (Global Edge CDN) | **None** (Runs 24/7 continuously) |
| **Server Specs** | Serverless Edge + Python Runtime | Dedicated 2 vCPU, 16 GB RAM, 50 GB Disk |
| **Database** | Neon.tech Cloud PostgreSQL (Permanent) | Built-in SQLite (Zero config) |
| **Cost** | 100% Free Forever | 100% Free Forever |
| **Credit Card Needed?** | **No** | **No** |
| **Custom Domain?** | Free (`yourname.com` or `*.vercel.app`) | Supported |
| **Setup Time** | ~3 Minutes | ~2 Minutes |

---

## Option 1: Vercel + Neon Cloud PostgreSQL (Fastest & Most Reliable)

Vercel provides instant global CDN speeds and serverless execution. Neon provides genuine cloud PostgreSQL that does not expire.

### Step 1: Create Your Free Cloud Database on Neon
1. Go to [Neon.tech](https://neon.tech) and click **Sign Up** (sign in with your GitHub account).
2. Click **Create Project**:
   - Project Name: `muneeb-portfolio`
   - Region: Select nearest to you (e.g., `AWS Frankfurt`, `AWS Singapore`, or `AWS US East`)
3. On your Neon dashboard, copy your **Connection String**. It looks like:
   ```text
   postgresql://muneeb_owner:AbCdEf123456@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com) and click **Sign Up** $\rightarrow$ **Continue with GitHub**.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Find your **`PersonalWebsite`** repository (or `GRAPHICMx911/PersonalWebsite`) and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset**: Leave as *Other* (our pre-configured `vercel.json` handles everything).
   - Expand the **Environment Variables** section and add these two variables:

| Variable Name | Value |
| :--- | :--- |
| `DATABASE_URL` | *(Paste your Neon connection string from Step 1)* |
| `JWT_SECRET_KEY` | `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2` |
| `SECRET_KEY` | `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2` |

5. Click **Deploy**!
6. In about 60 seconds, Vercel will build and give you your permanent production URL:
   - **`https://muneeb-portfolio.vercel.app`**
   - **`https://muneeb-portfolio.vercel.app/#resumes`** (CV Section)
   - **`https://muneeb-portfolio.vercel.app/admin/dashboard.html`** (Admin CMS)
   - **`https://muneeb-portfolio.vercel.app/admin/cvs.html`** (Admin CV Management)

---

## Option 2: Hugging Face Spaces (Dedicated 24/7 Docker Server)

Hugging Face Spaces allows you to run full Docker containers 24 hours a day, 7 days a week for free with **16GB of RAM** and **no credit card**.

### Step 1: Create a Space
1. Go to [Hugging Face](https://huggingface.co) and sign in (or sign up with GitHub/email).
2. Click on your profile icon in top right $\rightarrow$ **New Space** (or visit [huggingface.co/new-space](https://huggingface.co/new-space)).
3. Fill in the details:
   - **Space name**: `personal-portfolio`
   - **License**: `mit`
   - **Select the Space SDK**: Choose **Docker** $\rightarrow$ **Blank**.
   - **Space hardware**: Free (2 vCPU · 16 GB RAM).
   - **Visibility**: **Public**.
4. Click **Create Space**.

### Step 2: Push Your Code to the Space
Hugging Face Spaces gives you a Git repository URL (e.g., `https://huggingface.co/spaces/<your-username>/personal-portfolio`).
Run these commands in your project terminal:

```bash
git remote add hf https://huggingface.co/spaces/<your-username>/personal-portfolio
git push -u hf main:main --force
```

*(When prompted for password, generate a free Access Token with "Write" permissions at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)).*

### Step 3: Your Live Permanent URL
Hugging Face will automatically build your Docker container. Your app is live 24/7 at:
- **`https://<your-username>-personal-portfolio.hf.space`**
- All frontend, backend, and SQLite database run permanently inside the container!

---

## Summary of Permanent Admin Credentials
- **Admin Email / Username**: `admin` or `muneeb03022309111@gmail.com`
- **Password**: `Admin@123456`
- **Direct Login URL**: `/admin/login.html`
