"use client";

import { Bell, X, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime, ORDER_STATUS_COLORS } from "@/lib/utils";
import type { WsRole } from "@/hooks/useWebSocket";

interface NotificationBellProps {
  role: WsRole;
  tableId?: string;
  userId?: string;
}

export function NotificationBell({ role, tableId, userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, connected, markRead, markAllRead, clearAll } =
    useNotifications({ role, tableId, userId });

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notificaciones</span>
      </Button>

      {/* Connection dot */}
      <span
        className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${
          connected ? "bg-green-500" : "bg-gray-400"
        }`}
      />

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markAllRead} title="Marcar todo como leído">
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearAll} title="Limpiar todo">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Sin notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      !n.read ? "bg-muted/30" : ""
                    }`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              ORDER_STATUS_COLORS[n.status]
                            }`}
                          >
                            {n.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(n.timestamp)}
                          </span>
                        </div>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
