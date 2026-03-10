import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";

type SessionData = Awaited<ReturnType<typeof auth.api.getSession>>;
type StaffUser = SessionData extends { user: infer U } | null
  ? U & { role: "admin" | "waiter" | "chef"; active: boolean; username: string }
  : never;

export interface TRPCContext {
  session: SessionData;
  headers: Headers;
}

export const createTRPCContext = async (): Promise<TRPCContext> => {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  return { session, headers: headersList };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Public — no auth required */
export const publicProcedure = t.procedure;

/** Requires an authenticated session */
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
  }
  const user = ctx.session.user as StaffUser;
  if (!user.active) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Usuario inactivo" });
  }
  return opts.next({ ctx: { ...ctx, session: ctx.session, user } });
});

/** Requires admin or waiter role */
export const staffProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (ctx.user.role !== "admin" && ctx.user.role !== "waiter") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sin permiso" });
  }
  return opts.next();
});

/** Requires admin role only */
export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Requiere rol administrador" });
  }
  return opts.next();
});

/** Requires admin or chef role */
export const kitchenProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (ctx.user.role !== "admin" && ctx.user.role !== "chef") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sin permiso" });
  }
  return opts.next();
});
