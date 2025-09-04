import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a transaction ID to be displayed in the UI
 * Returns a shortened version (first 4 characters + "...")
 */
export function formatTransactionId(id: string): string {
  return `${id.substring(0, 4)}...`;
}

/**
 * Get a shortened transaction ID for filename purposes
 * Returns the first 8 characters without ellipsis
 */
export function getShortTransactionId(id: string): string {
  return id.substring(0, 8);
}
