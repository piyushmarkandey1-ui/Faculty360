import type { Metadata } from "next";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { CinematicStory } from "@/components/landing/CinematicStory";
import { ProfileShowcase } from "@/components/landing/ProfileShowcase";
import { AssessmentShowcase } from "@/components/landing/AssessmentShowcase";
import { PlatformPreview } from "@/components/landing/PlatformPreview";
import { CTASection } from "@/components/landing/CTASection";

export const metadata: Metadata = {
  title: "A³P-Web — From Fragmented Data to Explainable Insight",
  description:
    "AI-Enabled Academic Profile Analytics. Resolves faculty data from Google Scholar, ResearchGate, and institutional systems into unified, assessable profiles. Rules Calculate. AI Interprets. Humans Decide.",
};

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Fixed navigation — always visible */}
      <LandingNav />

      {/* Top spacer for fixed nav */}
      <div style={{ height: 64 }} />

      {/* [01] Hero Section */}
      <LandingHero />

      {/* [02] The Problem */}
      <LandingProblem />

      {/* [03] Cinematic Pipeline (pinned 450vh) */}
      <CinematicStory />

      {/* [04] Unified Faculty Profile */}
      <ProfileShowcase />

      {/* [05] Explainable Assessment */}
      <AssessmentShowcase />

      {/* [06] Platform Preview */}
      <PlatformPreview />

      {/* [07] Final CTA */}
      <CTASection />
    </div>
  );
}
