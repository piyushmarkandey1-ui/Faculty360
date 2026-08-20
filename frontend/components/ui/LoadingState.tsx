import React from 'react';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 min-h-[200px]", className)}>
      <motion.div
        className="w-12 h-12 rounded-full bg-[var(--accent-muted)] border-2 border-[var(--accent)]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      />
      {message && <p className="mt-4 text-sm font-medium text-[var(--text-secondary)] animate-pulse">{message}</p>}
    </div>
  );
}
