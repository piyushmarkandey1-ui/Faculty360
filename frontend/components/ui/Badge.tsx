import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-full border border-transparent",
        size === 'sm' ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        variant === 'success' && "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
        variant === 'warning' && "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
        variant === 'danger' && "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20",
        variant === 'info' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
        variant === 'neutral' && "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
        variant === 'accent' && "bg-[var(--accent-muted)] text-[var(--accent-light)] border-[var(--accent)]/20",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
