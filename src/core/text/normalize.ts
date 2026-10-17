/** Lowercase and keep only a-z, so OCR noise (spaces, punctuation, digits) never blocks a match. */
export const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, '');
