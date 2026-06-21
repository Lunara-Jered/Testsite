/**
 * Formats standard ISO or string date to French format (DD/MM/YYYY)
 * as per constraints.
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "--/--/----";
  
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      // Fallback if string date is already YYYY-MM-DD
      if (typeof dateInput === "string" && dateInput.includes("-")) {
        const parts = dateInput.split("-");
        if (parts.length === 3) {
          return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
        }
      }
      return String(dateInput);
    }
    
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "--/--/----";
  }
}

/**
 * Basic tailwind utility to combine class names
 */
export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Map status to French labels and color themes
 */
export interface StatusTheme {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export function getStatusTheme(status: string): StatusTheme {
  switch (status) {
    case "DRAFT":
      return { label: "Brouillon", bg: "bg-gray-100 dark:bg-slate-800", text: "text-gray-600 dark:text-gray-300", border: "border-gray-200 dark:border-slate-700" };
    case "SUBMITTED":
      return { label: "Soumis", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-900/30" };
    case "PROCESSING":
    case "UNDER_REVIEW":
      return { label: "En Instruction", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/30" };
    case "APPROVED":
    case "AUTHORIZED":
    case "READY":
      return { label: "Approuvé / Prêt", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/30" };
    case "COMPLETED":
    case "CELEBRATED":
    case "DELIVERED":
    case "COLLECTED":
      return { label: "Délivré / Célébré", bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-600 dark:text-teal-400", border: "border-teal-100 dark:border-teal-900/30" };
    case "REJECTED":
    case "REFUSED":
      return { label: "Rejeté", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", border: "border-red-100 dark:border-red-900/30" };
    default:
      return { label: status, bg: "bg-gray-50 dark:bg-slate-900", text: "text-gray-650 dark:text-gray-400", border: "border-gray-100 dark:border-slate-800" };
  }
}
