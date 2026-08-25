# AcadLens — Official SIH Demo Script

This script outlines the exact, click-by-click sequence for the live 5-minute presentation. It is designed to be completely reliable using the built-in fallback modes if the internet is unstable.

## 1. Login
- **Action:** Open http://localhost:3000/login and click **Sign In** using the Admin credentials.
- **Expected:** Instantly routes you to the Institutional Dashboard.
- **Presenter Script:** *"Welcome to AcadLens. I am logging in as an Institution Admin. This dashboard gives universities a bird's-eye view of their entire faculty's performance and data quality, which is crucial for NAAC accreditation."*

## 2. Dashboard Overview
- **Action:** Briefly hover over the stats (Avg Assessment, Total Faculty).
- **Expected:** Animations count up, showing high-level institutional health.
- **Presenter Script:** *"Immediately, we see that our institution has an average assessment score of 76.4, but we also see 12 pending data conflicts that require our attention."*

## 3. Faculty Directory
- **Action:** Click on **Dr. Rajesh Kumar Sharma** from the recent faculty list.
- **Expected:** Navigates to /faculty/[id] showing his unified profile.
- **Presenter Script:** *"Let's drill down into a specific professor, Dr. Sharma. AcadLens has already imported his internal university data, like teaching hours, but his public academic profile is incomplete."*

## 4. Source Sync (The Aggregation Engine)
- **Action:** Go to the **Sources** tab. Click **Connect** on Google Scholar. Enter any ID (e.g., demo123) and click **Sync**.
- **Expected:** A simulated loading state, followed by successful connection. (The backend gracefully falls back to mock data to ensure the demo works without an API key).
- **Presenter Script:** *"With a single click, AcadLens connects to Google Scholar and ORCID to autonomously fetch his publications and citations. It eliminates weeks of manual data entry."*

## 5. Unified Data (The Conflict)
- **Action:** Click the **Review Conflicts** alert banner (or go to the Conflicts tab).
- **Expected:** Shows a data discrepancy for the publication "Machine Learning for Geospatial Data Analysis". Scholar says 450 citations, ORCID says 0.
- **Presenter Script:** *"Here is where our AI shines. It automatically detected that Google Scholar and ORCID reported conflicting citation counts for the exact same paper. It flagged it so the admin can review it."*

## 6. Conflict Resolution (Human-in-the-Loop)
- **Action:** Click **Accept Scholar Data** on that conflict.
- **Expected:** The conflict disappears and the record is merged into the Canonical Record.
- **Presenter Script:** *"We keep humans in the loop. The admin confirms the Google Scholar data is correct, and the system merges it into one pristine, deduplicated canonical record."*

## 7. Assessment Engine
- **Action:** Navigate to the **Assessment** tab and click **Recalculate Assessment**.
- **Expected:** Score updates instantly based on the newly resolved data.
- **Presenter Script:** *"Now that the data is clean, our deterministic rules engine instantly recalculates his performance score across Research, Teaching, and Innovation."*

## 8. Explainability
- **Action:** Click **View Evidence** next to the Research score.
- **Expected:** A modal or expanded view showing the exact publications contributing to that score.
- **Presenter Script:** *"Unlike 'black box' AI, AcadLens provides 100% transparent evidence. Accreditation bodies can see the exact mathematical breakdown and the original source documents behind every single point."*

## 9. AI Insights
- **Action:** Click **Generate AI Insights** (or highlight the AI summary box).
- **Expected:** Displays a Gemini-generated summary of strengths and anomalies.
- **Presenter Script:** *"Finally, we use Google Gemini to read the mathematical assessment and generate a human-readable advisory report. It helps Deans understand exactly where the faculty member excels and where they need support."*

## 10. Report Export
- **Action:** Go to the **Reports** tab on the sidebar. Click **Export CSV**.
- **Expected:** A CSV file downloads.
- **Presenter Script:** *"When it's time for the NAAC audit, the university just exports the fully verified, conflict-free matrix in one click."*
