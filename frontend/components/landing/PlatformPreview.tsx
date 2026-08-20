"use client";

import { motion } from "framer-motion";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { Users, AlertCircle, CheckCircle2, TrendingUp, Download } from "lucide-react";

const TEAL = "#0F8B8D";
const NAVY = "#17233C";
const SLATE = "#5D6B82";
const BORDER = "#E4E8EF";
const GOLD = "#D6A84F";
const EMERALD = "#2E9B72";
const BLUE = "#4F6BED";

const TABLE_DATA = [
  { name: "Dr. Rajesh Kumar Sharma", dept: "Computer Science", score: 84.7, status: "Verified", color: EMERALD },
  { name: "Dr. Priya Patel", dept: "Electronics", score: 91.2, status: "Verified", color: EMERALD },
  { name: "Dr. Amit Singh", dept: "Mechanical", score: 72.5, status: "Conflict (1)", color: GOLD },
  { name: "Dr. Sunita Rao", dept: "Physics", score: 88.9, status: "Syncing", color: TEAL },
];

export function PlatformPreview() {
  return (
    <section id="platform-section" className="py-24 bg-white border-t" style={{ borderColor: BORDER }}>
      <div className="container-page max-w-6xl">
        <SectionReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: NAVY }}>
              DESIGNED FOR <span style={{ color: TEAL }}>INSTITUTIONAL SCALE.</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: SLATE }}>
              A powerful dashboard to monitor faculty data quality, resolve conflicts, and track institutional performance.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.2} direction="up">
          <motion.div 
            className="w-full rounded-2xl border shadow-xl bg-gray-50 overflow-hidden" 
            style={{ borderColor: BORDER }}
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(23,35,60,0.1)" }}
            transition={{ duration: 0.4 }}
          >
            {/* Dashboard Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-white" style={{ borderColor: BORDER }}>
              <div className="font-bold text-lg flex items-center gap-2" style={{ color: NAVY }}>
                <div className="w-2 h-2 rounded-full" style={{ background: TEAL }} />
                Platform Overview
              </div>
              <div className="flex gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: "#F7F8F5" }}
                  whileTap={{ scale: 0.98 }}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-white border flex items-center gap-2 cursor-pointer" 
                  style={{ color: SLATE, borderColor: BORDER }}
                >
                  <Download size={14} /> Export Report
                </motion.button>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {[
                { title: "Total Faculty", val: 148, icon: Users, color: TEAL },
                { title: "Avg. Assessment", val: 76.4, icon: TrendingUp, color: BLUE },
                { title: "Data Completeness", val: 92, suffix: "%", icon: CheckCircle2, color: EMERALD },
                { title: "Pending Conflicts", val: 12, icon: AlertCircle, color: GOLD },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  className="p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow" 
                  style={{ borderColor: BORDER }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.title}</div>
                    <stat.icon size={15} style={{ color: stat.color }} />
                  </div>
                  <div className="text-3xl font-extrabold font-mono flex items-baseline gap-1" style={{ color: NAVY }}>
                    {stat.val}
                    {stat.suffix && <span className="text-lg text-slate-400">{stat.suffix}</span>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Dashboard Table Preview */}
            <div className="px-6 pb-6">
              <div className="w-full rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b" style={{ borderColor: BORDER }}>
                    <tr>
                      <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500">Faculty Name</th>
                      <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500">Department</th>
                      <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500">Score</th>
                      <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {TABLE_DATA.map((row, i) => (
                      <motion.tr 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        whileHover={{ backgroundColor: "#F7F8F5" }}
                        className="group"
                      >
                        <td className="px-4 py-3.5 font-bold" style={{ color: NAVY }}>{row.name}</td>
                        <td className="px-4 py-3.5 font-medium" style={{ color: SLATE }}>{row.dept}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono w-10" style={{ color: NAVY }}>{row.score.toFixed(1)}</span>
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <motion.div 
                                className="h-full rounded-full" 
                                style={{ background: TEAL }}
                                initial={{ width: "0%" }}
                                whileInView={{ width: `${row.score}%` }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors" style={{ background: row.color + "15", color: row.color }}>
                            {row.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  );
}
