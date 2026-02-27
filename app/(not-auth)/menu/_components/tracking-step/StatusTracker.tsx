import { Clock, ChefHat, PackageCheck, CheckCircle, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import type { Order } from "../../_services/useOrder";

const STATUS_ICONS = {
  pending: Clock,
  in_preparation: ChefHat,
  ready_to_deliver: PackageCheck,
  completed: CheckCircle,
  paid: CreditCard,
};

const STATUS_STEPS = ["pending", "in_preparation", "ready_to_deliver", "completed", "paid"] as const;

interface StatusTrackerProps {
  status: Order["status"];
  orderId: string;
}

export function StatusTracker({ status, orderId }: StatusTrackerProps) {
  const currentIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          {STATUS_STEPS.map((s, idx) => {
            const Icon = STATUS_ICONS[s];
            const done = idx <= currentIndex;
            const active = idx === currentIndex;
            return (
              <div key={s} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  } ${active ? "ring-2 ring-primary ring-offset-2" : ""}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] text-center text-muted-foreground hidden sm:block">
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <Badge
            variant="outline"
            className={`text-sm px-4 py-1 ${["completed", "paid"].includes(status) ? "border-green-400 text-green-700 dark:text-green-400" : "border-blue-400 text-blue-700 dark:text-blue-400"}`}
          >
            {ORDER_STATUS_LABELS[status]}
          </Badge>
          <p className="mt-2 text-xs text-muted-foreground">
            Pedido #{orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
