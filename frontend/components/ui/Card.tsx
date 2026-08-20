import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ children, className, hover = false, onClick, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden",
        (hover || onClick) && "cursor-pointer transition-all duration-150 hover:border-[var(--border-default)] hover:-translate-y-px",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
