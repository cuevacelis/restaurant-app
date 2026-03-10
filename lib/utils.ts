import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// currency y locale se leen de restaurant_config en DB (currency_code / currency_locale).
// Por defecto usan PEN / es-PE. A futuro se pueden pasar desde un contexto global
// o por plato individualmente.
export function formatCurrency(
  amount: string | number,
  currency = "PEN",
  locale = "es-PE"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatWaitTime(createdAt: string | Date): string {
  const minutes = differenceInMinutes(new Date(), new Date(createdAt));
  if (minutes < 1) return "Ahora mismo";
  if (minutes === 1) return "1 minuto";
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours} hora${hours > 1 ? "s" : ""}`;
}

export function getWaitTimeColor(createdAt: string | Date): string {
  const minutes = differenceInMinutes(new Date(), new Date(createdAt));
  if (minutes < 15) return "text-green-600 dark:text-green-400";
  if (minutes < 30) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

// Re-exportados desde lib/order-status.ts — no duplicar aquí.
export { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/db/order-status";

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  waiter: "Mesero",
  chef: "Chef",
};

export function generateQrUrl(tableNumber: number, baseUrl: string): string {
  return `${baseUrl}/menu?tableId=${tableNumber}`;
}
