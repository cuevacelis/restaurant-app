import { CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "../../_services/usePayment";

interface PaymentSectionProps {
  totalAmount: string;
  methods: PaymentMethod[];
  creatingPreference: boolean;
  onMPPay: () => void;
}

export function PaymentSection({
  totalAmount,
  methods,
  creatingPreference,
  onMPPay,
}: PaymentSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">¿Cómo deseas pagar?</CardTitle>
        <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalAmount)}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {methods.map((method) =>
          method.type === "manual" ? (
            <div key={method.id} className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-4 w-4 text-primary" />
                <p className="font-medium text-sm">{method.name}</p>
              </div>
              {method.display_text ? (
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {method.display_text}
                </p>
              ) : null}
            </div>
          ) : (
            <Button
              key={method.id}
              className="w-full"
              onClick={onMPPay}
              disabled={creatingPreference}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {creatingPreference ? "Cargando..." : `Pagar con ${method.name}`}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
