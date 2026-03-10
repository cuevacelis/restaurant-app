"use client";

import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

export function useLogin() {
  const login = async (data: { username: string; password: string }) => {
    const result = await signIn.username({
      username: data.username,
      password: data.password,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Sesión iniciada correctamente");
          window.location.href = "/dashboard";
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Error al iniciar sesión");
        },
      },
    });
    return result;
  };

  return {
    mutate: login,
    mutateAsync: login,
    isPending: false, // Better Auth handles loading state internally
  };
}
