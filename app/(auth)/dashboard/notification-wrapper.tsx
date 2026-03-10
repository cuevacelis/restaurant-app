"use client";

import { NotificationBell } from "@/components/notifications/notification-bell";
import type { User } from "@/lib/auth";

export function DashboardNotificationWrapper({
  session,
}: {
  session: User;
}) {
  return <NotificationBell role={session.role} userId={session.id} />;
}
