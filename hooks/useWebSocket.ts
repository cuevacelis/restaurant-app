"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export type WsRole = "customer" | "waiter" | "chef" | "admin";

export interface WsOrderUpdate {
  type: "ORDER_UPDATE";
  data: {
    event: "INSERT" | "UPDATE";
    order_id: string;
    table_id: string | null;
    customer_name: string;
    order_type: string;
    status: string;
    total_amount: string;
    updated_at: string;
  };
}

export type WsMessage = WsOrderUpdate;

interface UseWebSocketOptions {
  role: WsRole;
  tableId?: string;
  userId?: string;
  orderId?: string;
  onMessage?: (msg: WsMessage) => void;
  enabled?: boolean;
}

export function useWebSocket({
  role,
  tableId,
  userId,
  orderId,
  onMessage,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!wsUrl || !enabled) return;

    try {
      const url = new URL(wsUrl);
      url.searchParams.set("role", role);
      if (tableId) url.searchParams.set("tableId", tableId);
      if (userId) url.searchParams.set("userId", userId);
      if (orderId) url.searchParams.set("orderId", orderId);

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          setLastMessage(msg);
          onMessageRef.current?.(msg);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 3s
        reconnectTimeout.current = setTimeout(() => connect(), 3000);
      };

      ws.onerror = () => ws.close();
    } catch {
      // WebSocket URL not configured yet — silent fail in dev
    }
  }, [role, tableId, userId, orderId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect, enabled]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, lastMessage, send };
}
