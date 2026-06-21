/**
 * Formats a number to Franc CFA (XOF) format with a non-breaking space separator as per OHADA norms.
 */
export function formatCFA(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0 F CFA";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0 F CFA";

  const formatted = Math.abs(num).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Use a non-breaking space (\u00a0) to separate thousands
  const nonBreakingFormatted = formatted.replace(/\s/g, "\u00a0");

  return `${num < 0 ? "-" : ""}${nonBreakingFormatted}\u00a0F\u00a0CFA`;
}

/**
 * Formats a number to Franc CFA (XOF) with 2 fixed decimal places.
 */
export function formatCFAWithDecimals(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0,00 F CFA";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0,00 F CFA";

  const formatted = Math.abs(num).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const nonBreakingFormatted = formatted.replace(/\s/g, "\u00a0");

  return `${num < 0 ? "-" : ""}${nonBreakingFormatted}\u00a0F\u00a0CFA`;
}
