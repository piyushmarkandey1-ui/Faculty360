import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: "AcadLens | AI-Enabled Academic Profile Analytics",
    template: "%s | AcadLens",
  },
  description:
    "AcadLens unifies fragmented academic data into evidence-based, explainable faculty profiles and assessments.",
  keywords: ["academic", "faculty", "analytics", "assessment", "SIH 2026"],
  openGraph: {
    title: "AcadLens | AI-Enabled Academic Profile Analytics",
    description:
      "AcadLens unifies fragmented academic data into evidence-based, explainable faculty profiles and assessments.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
