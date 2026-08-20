import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, iconRight, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] active:scale-[0.98]",
          size === 'sm' && "text-xs px-3 py-1.5 gap-1.5",
          size === 'md' && "text-sm px-4 py-2 gap-2",
          size === 'lg' && "text-sm px-6 py-2.5 gap-2",
          variant === 'primary' && "bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-light)]",
          variant === 'secondary' && "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]",
          variant === 'ghost' && "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]",
          variant === 'danger' && "bg-[var(--danger)] text-white hover:opacity-90",
          (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && <span className="shrink-0">{icon}</span>}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
