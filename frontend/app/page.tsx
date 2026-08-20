import type { Metadata } from "next";
import { LandingNav } from "@/components/layout/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { PipelineSection } from "@/components/landing/PipelineSection";
import { ProfileSection } from "@/components/landing/ProfileSection";
import { AssessmentSection } from "@/components/landing/AssessmentSection";
import { ExplainSection } from "@/components/landing/ExplainSection";
import { InsightsSection } from "@/components/landing/InsightsSection";
import { CTASection } from "@/components/landing/CTASection";

export const metadata: Metadata = {
  title: "A³P-Web — From Fragmented Data to Explainable Insight",
  description:
    "AI-Enabled Academic Profile Analytics. Resolves faculty data from Google Scholar, ResearchGate, and institutional systems into unified, assessable profiles. Rules Calculate. AI Interprets. Humans Decide.",
};

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <PipelineSection />
      <ProfileSection />
      <AssessmentSection />
      <ExplainSection />
      <InsightsSection />
      <CTASection />
    </div>
  );
}
