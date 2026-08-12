import { clsx, type ClassValue } from 'clsx'

/**
 * Join conditional class lists. No tailwind-merge here on purpose. Nothing in
 * this app composes conflicting utilities, and the merge tables cost more than
 * the rest of the bundle put together.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
