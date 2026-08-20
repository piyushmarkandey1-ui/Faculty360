"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { CheckCircle2, ChevronRight, BookOpen, GraduationCap, Users } from "lucide-react";

const TEAL = "#0F8B8D";
const NAVY = "#17233C";
const SLATE = "#5D6B82";
const WHITE = "#FFFFFF";
const BORDER = "#E4E8EF";

const TABS = ["Overview", "Research", "Teaching", "Mentoring", "Innovation", "Service", "Outreach"];

export function ProfileShowcase() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <section className="py-24 bg-white border-t" style={{ borderColor: BORDER }}>
      <div className="container-page max-w-6xl">
        <SectionReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: NAVY }}>
              ONE FACULTY.
              <br />
              <span style={{ color: TEAL }}>ONE UNIFIED PROFILE.</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: SLATE }}>
              All fragmented records merged, deduplicated, and resolved into a single source of truth.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.2} direction="up">
          <motion.div 
            className="w-full rounded-2xl border shadow-xl overflow-hidden"
            style={{ background: "#FAFAFA", borderColor: BORDER }}
            whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(23,35,60,0.08)" }}
            transition={{ duration: 0.3 }}
          >
            {/* App-like Header */}
            <div className="px-8 py-6 border-b flex justify-between items-center" style={{ background: WHITE, borderColor: BORDER }}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: TEAL + "15", color: TEAL }}>
                  RK
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: NAVY }}>Dr. Rajesh Kumar Sharma</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm font-medium" style={{ color: SLATE }}>
                    <span>Associate Professor</span>
                    <span>·</span>
                    <span>Computer Science</span>
                    <span>·</span>
                    <span className="flex items-center gap-1" style={{ color: TEAL }}>
                      <CheckCircle2 size={14} /> Identity Verified
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg border text-sm font-bold cursor-pointer" 
                  style={{ borderColor: BORDER, color: NAVY }}
                >
                  Assess Faculty
                </motion.div>
              </div>
            </div>

            {/* App-like Tabs */}
            <div className="px-8 flex gap-8 border-b overflow-x-auto relative scrollbar-hide" style={{ background: WHITE, borderColor: BORDER }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="py-4 text-sm font-bold whitespace-nowrap relative focus:outline-none"
                    style={{ color: isActive ? TEAL : SLATE }}
                  >
                    {tab}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: TEAL }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* App-like Content */}
            <div className="p-8 grid md:grid-cols-[1fr_300px] gap-8 bg-white min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="px-6 py-5 rounded-xl border bg-white" style={{ borderColor: BORDER }}>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: NAVY }}>
                      {activeTab === "Overview" ? "Recent Publications (Canonical)" : `${activeTab} Highlights`}
                    </h4>
                    
                    {activeTab === "Overview" && (
                      <div className="space-y-4">
                        {[1, 2, 3].map((item, i) => (
                          <motion.div 
                            key={item} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-4 items-start pb-4 border-b last:border-0 last:pb-0" 
                            style={{ borderColor: BORDER }}
                          >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0" style={{ background: TEAL + "10", color: TEAL }}>
                              {2024 - i}
                            </div>
                            <div>
                              <div className="font-bold text-sm mb-1" style={{ color: NAVY }}>
                                {i === 0 ? "Machine Learning for Smart Agriculture in Rural Regions" : 
                                 i === 1 ? "Deep Neural Networks for Predictive Maintenance" :
                                 "Survey of Edge Computing Architecture in IoT"}
                              </div>
                              <div className="text-xs font-medium" style={{ color: SLATE }}>
                                IEEE Transactions on Sustainable Computing · {42 - i * 15} Citations
                              </div>
                              <div className="flex gap-2 mt-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">Google Scholar</span>
                                {i !== 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">Institutional</span>}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {activeTab !== "Overview" && (
                       <div className="flex flex-col items-center justify-center h-40 text-sm" style={{ color: SLATE }}>
                         Interactive preview data for {activeTab}.<br/>Explore the full platform to see more details.
                       </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="space-y-6">
                <div className="px-6 py-5 rounded-xl border bg-white" style={{ borderColor: BORDER }}>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: NAVY }}>Sources (4)</h4>
                  <div className="space-y-3">
                    {["Google Scholar", "Institutional ERP", "ResearchGate", "ORCID"].map((src, i) => (
                      <motion.div 
                        key={src} 
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="font-medium" style={{ color: SLATE }}>{src}</span>
                        <CheckCircle2 size={16} style={{ color: TEAL }} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  );
}
