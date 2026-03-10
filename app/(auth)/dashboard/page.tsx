import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrders, getOrderStats } from "@/lib/db/queries/orders";
import { getTables } from "@/lib/db/queries/tables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  ChefHat,
  CheckCircle,
  Clock,
  UtensilsCrossed,
} from "lucide-react";
import {
  formatCurrency,
  formatRelativeTime,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from "@/lib/utils";

export default async function DashboardPage() {
  const sessionResult = await auth.api.getSession({ headers: await headers() });
  const session = sessionResult?.user;

  const [stats, recentOrders, tables] = await Promise.all([
    getOrderStats(),
    getOrders({ limit: 5 }),
    getTables(),
  ]);

  const statsCards = [
    {
      title: "Pendientes",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      title: "En preparación",
      value: stats.in_preparation,
      icon: ChefHat,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Listos para entregar",
      value: stats.ready_to_deliver,
      icon: ClipboardList,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Completados hoy",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-gray-600",
      bg: "bg-gray-50 dark:bg-gray-900",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {session?.name} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen del estado actual del restaurante
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin pedidos aún
              </p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-1"
                >
                  <div>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.table_number
                        ? `Mesa #${order.table_number}`
                        : "Para llevar"}
                      {" · "}
                      {formatRelativeTime(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <Badge
                      className={`text-xs ${ORDER_STATUS_COLORS[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tables overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mesas ({tables.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="flex flex-col items-center gap-1 rounded-lg border p-2 hover:bg-muted/50 transition-colors"
                >
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{table.number}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {table.capacity}p
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
