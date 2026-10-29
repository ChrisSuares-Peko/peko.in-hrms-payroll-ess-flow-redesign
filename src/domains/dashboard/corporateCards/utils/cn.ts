import { twMerge } from 'tailwind-merge';

type ClassValue = string | number | null | false | undefined;

/**
 * Join conditional class names and resolve Tailwind conflicts (last-wins).
 * Lightweight local helper — the project has no global `cn`.
 */
export const cn = (...classes: ClassValue[]): string => twMerge(classes.filter(Boolean).join(' '));
