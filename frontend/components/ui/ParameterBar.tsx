import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';

interface ParameterBarProps {
  label: string;
  score: number;
  maxScore: number;
  color?: string;
  showScore?: boolean;
  className?: string;
}

export function ParameterBar({ label, score, maxScore, color = 'var(--accent)', showScore = true, className }: ParameterBarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--text-primary)]">{label}</span>
        {showScore && <span className="text-[var(--text-secondary)] font-mono text-xs">{score} / {maxScore}</span>}
      </div>
      <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: mounted ? `${percentage}%` : '0%' }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
