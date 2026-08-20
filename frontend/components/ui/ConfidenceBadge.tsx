import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from './Badge';

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  let variant: 'success' | 'warning' | 'danger' = 'danger';
  if (confidence >= 85) variant = 'success';
  else if (confidence >= 65) variant = 'warning';

  return (
    <Badge variant={variant} size="sm" className={className}>
      Confidence {confidence}%
    </Badge>
  );
}
