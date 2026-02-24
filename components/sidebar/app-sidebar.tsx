"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  UtensilsCrossed,
  Users,
  BookOpen,
  LogOut,
  Monitor,
  CreditCard,
  QrCode,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"admin" | "waiter" | "chef">;
}

const navItems: NavItem[] = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "waiter", "chef"],
  },
  {
    title: "Pedidos",
    href: "/dashboard/orders",
    icon: ClipboardList,
    roles: ["admin", "waiter"],
  },
  {
    title: "Cocina",
    href: "/dashboard/kitchen",
    icon: ChefHat,
    roles: ["admin", "chef"],
  },
  {
    title: "Mesas",
    href: "/dashboard/tables",
    icon: UtensilsCrossed,
    roles: ["admin", "waiter"],
  },
  {
    title: "Menú",
    href: "/dashboard/menu",
    icon: BookOpen,
    roles: ["admin"],
  },
  {
    title: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Métodos de pago",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["admin"],
  },
  {
    title: "Pantalla clientes",
    href: "/pantalla",
    icon: Monitor,
    roles: ["admin"],
  },
  {
    title: "Menú general",
    href: "/menu",
    icon: QrCode,
    roles: ["admin"],
  },
];

interface AppSidebarProps {
  session: SessionPayload;
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(session.role)
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Restaurante</span>
            <span className="text-xs text-muted-foreground">Sistema de gestión</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {session.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[session.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
