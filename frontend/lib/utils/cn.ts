/**
 * cn() — Composable class merging utility.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Use this for all conditional Tailwind class composition in components.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
