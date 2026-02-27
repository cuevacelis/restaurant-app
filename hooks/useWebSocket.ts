"use client";

import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";

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
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onMessageRef = useRef(onMessage);
  const connectRef = useRef<() => void>(() => {});

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
        reconnectTimeout.current = setTimeout(() => connectRef.current(), 3000);
      };

      ws.onerror = () => ws.close();
    } catch {
      // WebSocket URL not configured yet — silent fail in dev
    }
  }, [role, tableId, userId, orderId, enabled]);

  // Sync refs after render — must not read/write refs during render (React 19)
  useLayoutEffect(() => {
    onMessageRef.current = onMessage;
    connectRef.current = connect;
  });

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      if (wsRef.current) {
        // Null out onclose to prevent the auto-reconnect from firing on intentional close
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect, enabled]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, lastMessage, send };
}
