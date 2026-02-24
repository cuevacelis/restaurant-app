import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
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

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_preparation: "En preparación",
  ready_to_deliver: "Listo para entregar",
  completed: "Entregado",
  cancelled: "Cancelado",
  paid: "Pagado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  in_preparation: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ready_to_deliver: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  paid: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  waiter: "Mesero",
  chef: "Chef",
};

export function generateQrUrl(tableNumber: number, baseUrl: string): string {
  return `${baseUrl}/mesa/${tableNumber}`;
}
