# Permanent 24/7 Cloud Deployment Guide

This guide explains how to deploy your **Personal Portfolio & Admin CMS** to the cloud for free with permanent 24/7 uptime that lasts for years.

---

## Architecture Overview

| Component | Service | Cost | Features |
| :--- | :--- | :--- | :--- |
| **Code Repository** | [GitHub](https://github.com) | Free | Automatic continuous deployment on every `git push` |
| **Web Service Host** | [Render.com](https://render.com) | Free | Permanent URL (`https://<your-name>.onrender.com`), automatic SSL |
| **Database** | [Neon.tech](https://neon.tech) or Render Postgres | Free | Cloud PostgreSQL with persistent storage |

---

## Step 1: Create a GitHub Repository & Push

1. Open your browser and go to [GitHub New Repository](https://github.com/new).
2. Set Repository Name: `PersonalWebsite` (or `portfolio`).
3. Set visibility to **Public** or **Private**.
4. Leave "Add a README" **unchecked** (we already have a complete repo).
5. Click **Create repository**.
6. Run the following commands in your project terminal:

```bash
git remote add origin https://github.com/GRAPHICMx911/PersonalWebsite.git
git branch -M main
git push -u origin main
```

*(Windows Git Credential Manager will open a small window to authorize GitHub once).*

---

## Step 2: Get a Free Cloud PostgreSQL Database (Neon.tech)

1. Go to [Neon.tech](https://neon.tech) and sign up with your GitHub or Google account.
2. Click **Create Project** (Name: `portfolio-db`).
3. In your Neon dashboard, copy your **Connection String** (starts with `postgresql://...`).

---

## Step 3: Deploy on Render.com

1. Go to [Render.com](https://render.com) and click **Sign Up with GitHub**.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your `PersonalWebsite` repository.
4. Configure the settings:
   - **Name**: `muneeb-portfolio` (this determines your link: `https://muneeb-portfolio.onrender.com`)
   - **Region**: Closest to you (e.g. Frankfurt / Singapore / Oregon)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
5. Under **Environment Variables**, click **Add Environment Variable**:
   - `DATABASE_URL`: *(paste the connection string from Neon.tech)*
   - `JWT_SECRET_KEY`: `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2`
   - `SECRET_KEY`: `9f82d1c6e4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2`
   - `PYTHON_VERSION`: `3.11.9`
6. Click **Create Web Service**!

---

## Step 4: Automatic Setup & Verification

Render will automatically build and start your application.
On initial boot:
- The backend automatically creates all database tables.
- It automatically seeds your profile details, contact email (`muneeb03022309111@gmail.com`), tailored CVs, skills, and admin account.
- Your website is now permanently live worldwide 24/7/365 at:
  **`https://muneeb-portfolio.onrender.com`**
