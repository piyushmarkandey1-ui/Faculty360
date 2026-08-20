import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ children, className, hover = false, onClick, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)]",
        (hover || onClick) && "cursor-pointer transition-all duration-200 hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
