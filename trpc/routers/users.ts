import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "../init";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "@/lib/db/queries/auth";

export const usersRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    const users = await getAllUsers();
    return { users };
  }),

  create: adminProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(6),
        role: z.enum(["admin", "waiter", "chef"]),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await getUserById(input.username).catch(() => null);
      void existing;
      const user = await createUser({
        username: input.username,
        password: input.password,
        role: input.role,
        name: input.name,
      });
      return { user };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        role: z.enum(["admin", "waiter", "chef"]).optional(),
        active: z.boolean().optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const user = await updateUser(id, data);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
      return { user };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteUser(input.id);
      return { ok: true };
    }),
});
