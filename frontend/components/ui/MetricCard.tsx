import React from 'react';
import { cn } from '@/lib/utils/cn';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';
import { AnimatedCounter } from './AnimatedCounter';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: LucideIcon;
  color?: string;
  className?: string;
}

export function MetricCard({ label, value, unit, trend, icon: Icon, color = 'var(--accent)', className }: MetricCardProps) {
  const isNumeric = typeof value === 'number';

  return (
    <Card className={cn("p-5 flex flex-col gap-3 relative overflow-hidden", className)}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 pointer-events-none" style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
        {Icon && <Icon className="w-5 h-5 text-[var(--text-muted)]" />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {isNumeric ? <AnimatedCounter value={value as number} /> : value}
        </span>
        {unit && <span className="text-sm font-medium text-[var(--text-secondary)] mb-1">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-[var(--success)]" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[var(--danger)]" />
          )}
          <span className={cn(
            "text-xs font-medium",
            trend.direction === 'up' ? "text-[var(--success)]" : "text-[var(--danger)]"
          )}>
            {trend.value}%
          </span>
          <span className="text-xs text-[var(--text-muted)] ml-1">vs last month</span>
        </div>
      )}
    </Card>
  );
}
