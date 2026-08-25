<div align="center">
  <img src="https://raw.githubusercontent.com/piyushmarkandey1-ui/Faculty360/main/frontend/public/logo.png" alt="AcadLens Logo" width="120" />
  <h1>AcadLens</h1>
  <p><b>AI-Enabled Academic Profile Analytics for Evidence-Based Faculty Assessment</b></p>
  <p><i>Smart India Hackathon 2026 — Problem Statement 64</i></p>
</div>

---

## 📖 Overview

**AcadLens** is a unified, deterministic, and verifiable platform designed to solve the critical data fragmentation problem in higher education institutions. When accreditation bodies (like NAAC, NBA, or NIRF) request faculty performance data, institutions often spend months manually aggregating messy, unverified spreadsheets.

AcadLens acts as an institutional **Single Source of Truth**. It automatically fetches, merges, and resolves academic data from Google Scholar, ORCID, ResearchGate, and internal institutional databases (CSVs) to provide 100% verified, mathematically backed faculty assessments.

## ✨ Key Features

- **Multi-Source Data Aggregation:** Automatically pulls real-time publication, citation, and h-index data using the Apify API (Google Scholar) and ORCID integrations.
- **Deterministic Assessment Engine:** Calculates a standardized score (0-100) based on customizable KPIs:
  - Research Output
  - Publication Quality
  - Research Impact
  - Outreach & Extension
  - Academic Leadership
- **Conflict Resolution Engine:** Intelligently flags discrepancies between different data sources (e.g., mismatched citation counts) and calculates a "Data Confidence Score".
- **Chain of Evidence:** Every metric in the dashboard can be traced back to its original source URL, ensuring absolute transparency for auditors.
- **One-Click NAAC/NBA Export:** Instantly export institutional CSV reports summarizing all faculty metrics and scores, entirely eliminating manual data entry.

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Recharts.
- **Backend:** FastAPI (Python), Pandas (for robust CSV processing), Apify Client.
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, JWT Authentication).
- **Hosting:** Vercel (Frontend & Serverless API routing), Render (Backend).

## 🚀 Live Demo

- **Frontend (App):** [https://acadlens.vercel.app](https://acadlens.vercel.app)
- **Backend (API):** [https://acadlens-api.onrender.com/docs](https://acadlens-api.onrender.com/docs) *(Swagger UI)*

## 📦 Deployment Instructions

AcadLens is designed for modern serverless deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions on configuring Supabase, Render, and Vercel.

## 👥 Team

* **Team Name:** [Insert Team Name]
* **Hackathon:** Smart India Hackathon 2026
* **Problem Statement:** PS64

---
<div align="center">
  <sub>Built with ❤️ for SIH 2026</sub>
</div>
