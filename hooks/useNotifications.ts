"use client";

import { useCallback, useState } from "react";
import { useWebSocket, type WsRole, type WsMessage } from "./useWebSocket";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

export interface Notification {
  id: string;
  title: string;
  message: string;
  orderId: string;
  status: string;
  tableId: string | null;
  customerName: string;
  timestamp: Date;
  read: boolean;
}

interface UseNotificationsOptions {
  role: WsRole;
  tableId?: string;
  userId?: string;
}

export function useNotifications({
  role,
  tableId,
  userId,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.type !== "ORDER_UPDATE") return;

    const { data } = msg;
    const statusLabel = ORDER_STATUS_LABELS[data.status] ?? data.status;

    let title = "";
    let message = "";

    switch (data.status) {
      case "pending":
        title = "Nuevo pedido";
        message = `${data.table_id ? `Mesa #${data.table_id}` : "Para llevar"} - ${data.customer_name}`;
        break;
      case "in_preparation":
        title = "Pedido en preparación";
        message = `Tu pedido está siendo preparado, ${data.customer_name}`;
        break;
      case "ready_to_deliver":
        title = "¡Pedido listo!";
        message = `El pedido de ${data.customer_name} está listo para entregar`;
        break;
      case "completed":
        title = "Pedido completado";
        message = `Pedido de ${data.customer_name} entregado`;
        break;
      default:
        title = "Actualización de pedido";
        message = `Estado: ${statusLabel}`;
    }

    const notification: Notification = {
      id: `${data.order_id}-${Date.now()}`,
      title,
      message,
      orderId: data.order_id,
      status: data.status,
      tableId: data.table_id,
      customerName: data.customer_name,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 50));

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body: message, icon: "/favicon.ico" });
    }
  }, []);

  const { connected } = useWebSocket({
    role,
    tableId,
    userId,
    onMessage: handleMessage,
  });

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    connected,
    markRead,
    markAllRead,
    clearAll,
  };
}
