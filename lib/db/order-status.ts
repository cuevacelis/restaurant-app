/**
 * Fuente única de verdad para los estados de pedido.
 *
 * - El tipo `OrderStatus` se deriva de este array → nunca se define a mano en otro archivo.
 * - `ORDER_STATUS_LABELS` y `ORDER_STATUS_COLORS` se derivan aquí y se re-exportan desde `lib/utils.ts`.
 * - `VALID_STATUSES` (Set) se usa en la API route de status para validación O(1).
 * - `STATUSES_FILTER` se usa en el dashboard para los filtros de la lista de pedidos.
 *
 * Para agregar un nuevo estado: añadir una entrada en ORDER_STATUSES.
 * No tocar ningún otro archivo de tipos.
 */

export const ORDER_STATUSES = [
  {
    value: "pending_verification",
    label: "Por verificar",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  {
    value: "pending",
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    value: "in_preparation",
    label: "En preparación",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    value: "ready_to_deliver",
    label: "Listo para entregar",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    value: "completed",
    label: "Entregado",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  {
    value: "cancelled",
    label: "Cancelado",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  {
    value: "paid",
    label: "Pagado",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

// Record<string, string> para que código que recibe status como string genérico
// (WebSocket, notificaciones) pueda indexar sin cast.
export const ORDER_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  ORDER_STATUSES.map((s) => [s.value, s.label])
);

export const ORDER_STATUS_COLORS: Record<string, string> = Object.fromEntries(
  ORDER_STATUSES.map((s) => [s.value, s.color])
);

/** Set para validación O(1) en la API route de status. */
export const VALID_STATUSES = new Set<OrderStatus>(ORDER_STATUSES.map((s) => s.value));

/** Lista para los filtros del dashboard (incluye opción "Todos"). */
export const STATUSES_FILTER: Array<{ value: string; label: string }> = [
  { value: "", label: "Todos" },
  ...ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];
