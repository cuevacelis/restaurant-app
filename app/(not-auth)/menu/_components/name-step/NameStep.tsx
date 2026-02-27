import { UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

interface NameStepProps {
  customerName: string;
  onChange: (name: string) => void;
  onSubmit: (e: React.SyntheticEvent) => void;
  tableId?: string;
}

export function NameStep({ customerName, onChange, onSubmit, tableId }: NameStepProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/background-login.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <CardTitle>Bienvenido</CardTitle>
          <p className="text-sm text-muted-foreground">
            {tableId ? `Mesa #${tableId}` : "Ver nuestro menú y hacer tu pedido"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Tu nombre</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Ej. Juan García"
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!customerName.trim()}>
              Ver la carta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
