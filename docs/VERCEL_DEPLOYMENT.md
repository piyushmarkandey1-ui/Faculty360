# AcadLens Frontend: Vercel Deployment Guide

This guide details the steps to deploy the AcadLens prototype to Vercel.

## 1. Project Information
- **Framework**: Next.js
- **Next.js Version**: 14.x (or 16.x depending on your lockfile)
- **Node.js Requirement**: Node.js 18.x or newer (recommended 20.x)
- **Package Manager**: npm (Standard npm based on package-lock.json/package.json)
- **Root Directory**: `/frontend` (Since the project is inside a `frontend` folder)

## 2. Build Settings for Vercel
When importing the repository into Vercel, use the following settings:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next`

## 3. Environment Variables
Currently, the prototype operates fully on frontend mock data and does not require active API keys.

**Required Environment Variables**:
- None

**Optional / Future Environment Variables** (Do not add these yet, but they will be needed when migrating to backend/APIs):
- `DATABASE_URL`
- `APIFY_TOKEN`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## 4. Deployment Steps
1. Navigate to your Vercel Dashboard (https://vercel.com)
2. Click **Add New... > Project**
3. Import your Git Repository
4. Configure the **Root Directory** by editing it to point to `frontend`
5. The **Framework Preset** should automatically detect `Next.js`
6. Click **Deploy**

## 5. Post-Deployment Checklist
Once the deployment finishes, verify the following:
- [ ] Visit the main landing page and verify the animations and cinematic scroll (ensure no overlapping content or hydration mismatch)
- [ ] Check responsiveness on mobile and tablet viewport widths
- [ ] Click "Explore Platform" to navigate to the `/dashboard` route
- [ ] Click "View Faculty Directory" to navigate to the `/faculty` route
- [ ] Ensure 404 pages render correctly (e.g., visit a non-existent URL)
- [ ] Test the platform on a device with "Reduced Motion" enabled to ensure accessibility 
