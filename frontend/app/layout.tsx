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
  title: {
    default: "A³P-Web | AI-Enabled Academic Profile Analytics",
    template: "%s | A³P-Web",
  },
  description:
    "A³P-Web unifies fragmented academic data into evidence-based, explainable faculty profiles and institutional assessment.",
  keywords: ["academic", "faculty", "analytics", "assessment", "SIH 2026"],
  openGraph: {
    title: "A³P-Web | AI-Enabled Academic Profile Analytics",
    description:
      "A³P-Web unifies fragmented academic data into evidence-based, explainable faculty profiles and institutional assessment.",
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
