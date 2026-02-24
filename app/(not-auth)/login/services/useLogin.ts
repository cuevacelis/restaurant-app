"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    role: string;
    name: string;
  };
}

async function loginFn(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al iniciar sesión");
  }

  return res.json();
}

export function useLogin() {
  return useMutation({
    mutationFn: loginFn,
    onSuccess: () => {
      toast.success("Sesión iniciada correctamente");
      window.location.href = "/dashboard";
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
