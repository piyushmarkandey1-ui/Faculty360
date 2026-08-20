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
        "inline-flex items-center justify-center font-semibold rounded-full border",
        size === 'sm' ? "text-[11px] px-2.5 py-0.5" : "text-xs px-3 py-1",
        variant === 'success' && "bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]/25",
        variant === 'warning' && "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]/25",
        variant === 'danger' && "bg-[var(--danger-muted)] text-[var(--danger)] border-[var(--danger)]/25",
        variant === 'info' && "bg-[var(--info-muted)] text-[var(--info)] border-[var(--info)]/25",
        variant === 'neutral' && "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]",
        variant === 'accent' && "bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]/30",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
