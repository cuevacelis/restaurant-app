import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MpBannersProps {
  mpStatus: string | null;
  orderStatus?: string;
}

export function MpBanners({ mpStatus, orderStatus }: MpBannersProps) {
  if (mpStatus === "success" && orderStatus !== "paid") {
    return (
      <Card className="mb-6 border-green-500/50 bg-green-500/5">
        <CardContent className="py-4 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-1" />
          <p className="text-sm font-medium text-green-600">¡Pago recibido! Confirmando...</p>
        </CardContent>
      </Card>
    );
  }

  if (mpStatus === "failure") {
    return (
      <Card className="mb-6 border-destructive/50 bg-destructive/5">
        <CardContent className="py-4 text-center">
          <p className="text-sm font-medium text-destructive">
            El pago no se completó. Intenta de nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (mpStatus === "pending") {
    return (
      <Card className="mb-6">
        <CardContent className="py-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Pago pendiente de confirmación.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
