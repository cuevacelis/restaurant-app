import { ChefHat, Clock, PackageCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Column = {
  status: "pending" | "in_preparation" | "ready_to_deliver";
  label: string;
  icon: LucideIcon;
  bg: string;
  border: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
};

export const COLUMNS: Column[] = [
  {
    status: "pending",
    label: "Recibido",
    icon: Clock,
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    badgeBg: "bg-yellow-100 dark:bg-yellow-900",
    badgeText: "text-yellow-800 dark:text-yellow-200",
  },
  {
    status: "in_preparation",
    label: "En preparación",
    icon: ChefHat,
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900",
    badgeText: "text-blue-800 dark:text-blue-200",
  },
  {
    status: "ready_to_deliver",
    label: "¡Listo para recoger!",
    icon: PackageCheck,
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
    badgeBg: "bg-green-100 dark:bg-green-900",
    badgeText: "text-green-800 dark:text-green-200",
  },
];
