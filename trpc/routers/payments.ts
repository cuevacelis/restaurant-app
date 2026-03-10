import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init";
import {
  getActivePaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/lib/db/queries/payments";

export const paymentsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.session?.user && (ctx.session.user as { role?: string }).role === "admin";
    if (isAdmin) {
      const methods = await getAllPaymentMethods();
      return { methods };
    }
    const methods = await getActivePaymentMethods();
    return { methods };
  }),

  listAdmin: adminProcedure.query(async () => {
    const methods = await getAllPaymentMethods();
    return { methods };
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["manual", "mercadopago"]),
        display_text: z.string().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        sort_order: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const method = await createPaymentMethod(input);
      return { method };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        type: z.enum(["manual", "mercadopago"]).optional(),
        display_text: z.string().nullable().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        sort_order: z.number().int().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const method = await updatePaymentMethod(id, data);
      if (!method) throw new TRPCError({ code: "NOT_FOUND" });
      return { method };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await deletePaymentMethod(input.id);
      return { ok: true };
    }),
});
