"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import type { SessionPayload } from "@/lib/auth";

export function DashboardNotificationWrapper({
  session,
}: {
  session: SessionPayload;
}) {
  return <NotificationBell role={session.role} userId={session.userId} />;
}
