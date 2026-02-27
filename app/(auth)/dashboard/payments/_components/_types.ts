import type { LucideIcon } from "lucide-react";
import { Banknote, CreditCard } from "lucide-react";

export interface PaymentMethod {
  id: string;
  name: string;
  type: "manual" | "mercadopago";
  display_text: string | null;
  config: Record<string, string>;
  active: boolean;
  sort_order: number;
}

export interface FormState {
  name: string;
  type: "manual" | "mercadopago";
  display_text: string;
  access_token: string;
  sort_order: string;
  active: boolean;
}

export const EMPTY_FORM: FormState = {
  name: "",
  type: "manual",
  display_text: "",
  access_token: "",
  sort_order: "0",
  active: true,
};

export const TYPE_LABELS: Record<string, string> = {
  manual: "Manual",
  mercadopago: "MercadoPago",
};

export const TYPE_ICONS: Record<string, LucideIcon> = {
  manual: Banknote,
  mercadopago: CreditCard,
};
