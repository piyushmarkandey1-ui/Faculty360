"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView, useReducedMotion, animate } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

const TEAL = "#0F8B8D";
const NAVY = "#17233C";
const BLUE = "#4F6BED";
const GOLD = "#D6A84F";
const WHITE = "#FFFFFF";
const BORDER = "#E4E8EF";
const SLATE = "#5D6B82";

// ─── SOURCE NODE CONFIG ───────────────────────────────────────────────────────
const SOURCE_NODES = [
  {
    id: "scholar",
    label: "Google Scholar",
    cx: 88, cy: 108,
    r: 9,
    color: TEAL,
    type: "PUBLIC SOURCE",
    fields: ["87 Publications", "1,842 Citations", "h-index 21"],
  },
  {
    id: "researchgate",
    label: "ResearchGate",
    cx: 432, cy: 108,
    r: 7,
    color: GOLD,
    type: "PUBLIC SOURCE",
    fields: ["43 Publications", "Research Activity: High"],
  },
  {
    id: "institutional",
    label: "Institutional Data",
    cx: 66, cy: 268,
    r: 8,
    color: BLUE,
    type: "AUTHORIZED SOURCE",
    fields: ["Teaching Load", "Mentoring", "Committees"],
  },
  {
    id: "orcid",
    label: "ORCID",
    cx: 432, cy: 268,
    r: 5,
    color: "#7C3AED",
    type: "PLANNED SOURCE",
    fields: ["Verified Author ID", "Works"],
  },
  {
    id: "projects",
    label: "Projects",
    cx: 156, cy: 408,
    r: 5,
    color: SLATE,
    type: "PLANNED SOURCE",
    fields: ["Research Grants", "Collaborations"],
  },
  {
    id: "patents",
    label: "Patents",
    cx: 364, cy: 408,
    r: 5,
    color: SLATE,
    type: "PLANNED SOURCE",
    fields: ["Filed Patents", "Granted Patents"],
  },
];

// SVG connection paths: source → AcadLens center (260, 270)
const CONNECTION_PATHS = [
  { id: "path-scholar",      d: "M 88 108 Q 160 190 260 270",   color: TEAL, primary: true },
  { id: "path-researchgate", d: "M 432 108 Q 360 190 260 270",  color: GOLD, primary: true },
  { id: "path-institutional",d: "M 66 268 Q 160 268 260 270",   color: BLUE, primary: true },
  { id: "path-orcid",        d: "M 432 268 Q 360 268 260 270",  color: "#7C3AED", primary: false },
  { id: "path-projects",     d: "M 156 408 Q 200 340 260 270",  color: SLATE, primary: false },
  { id: "path-patents",      d: "M 364 408 Q 320 340 260 270",  color: SLATE, primary: false },
];

// ─── PARTICLE ANIMATION ────────────────────────────────────────────────────────
function NetworkParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <>
      {CONNECTION_PATHS.filter(p => p.primary).map((path, pi) => (
        [0, 1].map((particleIdx) => (
          <circle key={`${path.id}-p${particleIdx}`} r={2.5} fill={path.color} opacity={0.75}>
            <animateMotion
              dur={`${2.2 + pi * 0.4}s`}
              begin={`${particleIdx * 1.1 + pi * 0.3}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.4 0 0.6 1"
            >
              <mpath href={`#${path.id}`} />
            </animateMotion>
          </circle>
        ))
      ))}
    </>
  );
}

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────
interface TooltipData {
  nodeId: string;
  label: string;
  type: string;
  fields: string[];
  x: number;
  y: number;
}

// ─── HERO DATA NETWORK SVG ────────────────────────────────────────────────────
function HeroNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Subtle pointer-driven translation of the entire SVG
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !svgRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    svgRef.current.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
  }, [shouldReduceMotion]);

  const handleMouseLeave = useCallback(() => {
    if (!svgRef.current) return;
    svgRef.current.style.transform = "translate(0px, 0px)";
    setTooltip(null);
  }, []);

  const handleNodeHover = useCallback((node: typeof SOURCE_NODES[0], svgX: number, svgY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Convert SVG coords (viewBox -100 0 720 480) to percentage
    const xPct = (svgX + 100) / 720;
    const yPct = svgY / 480;
    setTooltip({
      nodeId: node.id,
      label: node.label,
      type: node.type,
      fields: node.fields,
      x: rect.width * xPct,
      y: rect.height * yPct,
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        ref={svgRef}
        viewBox="-100 0 720 480"
        className="w-full h-full"
        aria-hidden="true"
        style={{ transition: "transform 0.4s cubic-bezier(0,0,0.2,1)" }}
      >
        <defs>
          {/* Gradient for primary connections */}
          <linearGradient id="grad-teal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.7" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="grad-gold" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.7" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="grad-blue" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={BLUE} stopOpacity="0.6" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0.15" />
          </linearGradient>

          {/* Define all paths for mpath references */}
          {CONNECTION_PATHS.map(p => (
            <path key={p.id} id={p.id} d={p.d} />
          ))}
        </defs>

        {/* Outer dashed ring */}
        <circle cx="260" cy="270" r="190" fill="none" stroke={BORDER} strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
        <circle cx="260" cy="270" r="120" fill="none" stroke={BORDER} strokeWidth="1" opacity="0.4" />

        {/* Connection paths */}
        {CONNECTION_PATHS.map((path) => {
          const gradId = path.id === "path-scholar" ? "url(#grad-teal)"
            : path.id === "path-researchgate" ? "url(#grad-gold)"
            : path.id === "path-institutional" ? "url(#grad-blue)"
            : path.color;
          return (
            <path
              key={path.id}
              d={path.d}
              stroke={gradId}
              strokeWidth={path.primary ? 1.5 : 1}
              fill="none"
              strokeDasharray={path.primary ? "none" : "3 5"}
              opacity={path.primary ? 0.8 : 0.4}
            />
          );
        })}

        {/* Animated particles */}
        <NetworkParticles />

        {/* AcadLens Central Node */}
        <circle cx="260" cy="270" r="30" fill={TEAL} opacity="0.12" />
        <circle cx="260" cy="270" r="22" fill={TEAL} />
        <text x="260" y="274" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="var(--font-mono)">AcadLens</text>
        {/* Pulse ring */}
        <circle cx="260" cy="270" r="32" fill="none" stroke={TEAL} strokeWidth="1" opacity="0.3">
          {!shouldReduceMotion && (
            <animate attributeName="r" values="28;36;28" dur="2.5s" repeatCount="indefinite" />
          )}
          {!shouldReduceMotion && (
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
          )}
        </circle>

        {/* Source Nodes */}
        {SOURCE_NODES.map((node) => (
          <g
            key={node.id}
            className="cursor-pointer"
            onMouseEnter={() => handleNodeHover(node, node.cx, node.cy)}
            onMouseLeave={() => setTooltip(null)}
          >
            <circle cx={node.cx} cy={node.cy} r={node.r + 6} fill={node.color} opacity="0.08" />
            <circle cx={node.cx} cy={node.cy} r={node.r} fill={WHITE} stroke={node.color} strokeWidth="2" />
            {!shouldReduceMotion && (
              <circle cx={node.cx} cy={node.cy} r={node.r + 2} fill="none" stroke={node.color} strokeWidth="0.5" opacity="0.4">
                <animate attributeName="r" values={`${node.r};${node.r + 5};${node.r}`} dur={`${2 + Math.random()}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur={`${2 + Math.random()}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}

        {/* Node Labels */}
        {SOURCE_NODES.map((node) => {
          const isLeft = node.cx < 260;
          const isBottom = node.cy > 350;
          const labelX = isBottom ? node.cx : isLeft ? node.cx - node.r - 8 : node.cx + node.r + 8;
          const labelY = isBottom ? node.cy + node.r + 14 : node.cy;
          const anchor = isBottom ? "middle" : isLeft ? "end" : "start";
          return (
            <text
              key={`label-${node.id}`}
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill={NAVY}
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-sans)"
              opacity="0.75"
              pointerEvents="none"
            >
              {node.label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 px-4 py-3 rounded-xl border shadow-xl"
          style={{
            left: tooltip.x + 16,
            top: Math.max(8, tooltip.y - 40),
            background: WHITE,
            borderColor: BORDER,
            boxShadow: "0 8px 30px rgba(23,35,60,0.12)",
            minWidth: 160,
            transform: "translateY(-50%)",
          }}
        >
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: TEAL }}>
            {tooltip.type}
          </div>
          <div className="text-xs font-bold mb-2" style={{ color: NAVY }}>{tooltip.label}</div>
          <div className="space-y-1">
            {tooltip.fields.map((f) => (
              <div key={f} className="text-[11px] font-medium" style={{ color: SLATE }}>{f}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });

  const HEADLINE_LINES = [
    { text: "FROM FRAGMENTED", color: NAVY },
    { text: "DATA", color: NAVY },
    { text: "TO CONNECTED", color: NAVY },
    { text: "EVIDENCE.", color: NAVY },
    { text: "TO EXPLAINABLE", color: NAVY },
    { text: "INSIGHT.", color: TEAL },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09 } },
  };

  const lineVariant: any = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 28, filter: "blur(8px)" },
    visible: shouldReduceMotion
      ? { opacity: 1, transition: { duration: 0.3 } }
      : { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: [0, 0, 0.2, 1] } },
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] flex items-center pt-16 pb-16 overflow-hidden"
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
          opacity: 0.25,
          maskImage: "radial-gradient(ellipse 70% 70% at 60% 40%, black 10%, transparent 90%)",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute"
          style={{
            width: 700, height: 600,
            background: `radial-gradient(ellipse, ${TEAL}0A 0%, transparent 70%)`,
            top: "-10%", right: "10%",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 500, height: 400,
            background: `radial-gradient(ellipse, ${BLUE}07 0%, transparent 70%)`,
            bottom: "5%", left: "5%",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="container-page relative z-10 w-full grid lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center">
        {/* LEFT: Content */}
        <div className="max-w-2xl">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-7 text-xs font-bold uppercase tracking-widest"
            style={{ color: TEAL }}
          >
            Smart India Hackathon 2026 · PS64
          </motion.div>

          {/* Headline */}
          <motion.div
            ref={headlineRef}
            className="space-y-0.5 mb-9"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {HEADLINE_LINES.map((line, i) => (
              <motion.div
                key={i}
                variants={lineVariant}
                className="block font-extrabold leading-[1.1]"
                style={{
                  fontSize: "clamp(2.4rem, 4.2vw, 3.8rem)",
                  color: line.color,
                  letterSpacing: "-0.025em",
                }}
              >
                {line.text}
              </motion.div>
            ))}
          </motion.div>

          {/* Supporting text */}
          <motion.p
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.75, ease: [0, 0, 0.2, 1] }}
            className="text-lg max-w-md mb-10 leading-relaxed"
            style={{ color: SLATE }}
          >
            Multi-source academic profile analytics built on evidence, deduplication, and transparent assessment.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.88 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              href={ROUTES.dashboard}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold shadow-sm group relative overflow-hidden transition-all duration-200"
              style={{ background: NAVY, color: WHITE }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(23,35,60,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              Explore Platform
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                <ArrowRight size={15} />
              </span>
            </Link>
            <a
              href="#story-section"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium border transition-all duration-200"
              style={{ color: NAVY, borderColor: BORDER, background: WHITE }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = TEAL;
                (e.currentTarget as HTMLElement).style.color = TEAL;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = BORDER;
                (e.currentTarget as HTMLElement).style.color = NAVY;
              }}
            >
              See How It Works
            </a>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="mt-16 flex items-center gap-2"
            style={{ color: SLATE }}
          >
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <ChevronDown size={16} />
            </motion.div>
            <span className="text-xs font-medium">Scroll to see how it works</span>
          </motion.div>
        </div>

        {/* RIGHT: Interactive Network */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
          className="hidden lg:block relative"
          style={{ height: 480 }}
        >
          <HeroNetwork />
        </motion.div>
      </div>
    </section>
  );
}
