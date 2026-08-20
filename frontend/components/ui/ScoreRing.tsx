import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ScoreRingProps {
  score: number; // 0 - 100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  color?: string; // CSS custom property or valid color
  className?: string;
}

export function ScoreRing({ score, size = 'md', label, color = 'var(--accent)', className }: ScoreRingProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dimensions = {
    sm: { size: 48, strokeWidth: 4, text: 'text-sm' },
    md: { size: 80, strokeWidth: 6, text: 'text-xl' },
    lg: { size: 120, strokeWidth: 8, text: 'text-3xl' },
  }[size];

  const radius = (dimensions.size - dimensions.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Fallback to 0 if not mounted to animate from 0
  const offset = circumference - ((mounted ? score : 0) / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: dimensions.size, height: dimensions.size }}
      >
        <svg className="absolute inset-0 transform -rotate-90" width={dimensions.size} height={dimensions.size}>
          <circle
            className="text-[var(--border-default)]"
            strokeWidth={dimensions.strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
          />
          <motion.circle
            stroke={color}
            strokeWidth={dimensions.strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className={cn("font-bold text-[var(--text-primary)]", dimensions.text)}>
          {Math.round(score)}
        </div>
      </div>
      {label && <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>}
    </div>
  );
}
