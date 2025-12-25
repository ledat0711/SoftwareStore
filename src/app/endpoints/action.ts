"use server";

import  prisma from "@/lib/prisma";
import { User } from '@prisma/client'
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticatedAction } from "@/lib/users/safe-action";
import { createUserFormSchema } from "@/lib/users/validations";
import { updateUserFormSchema } from "@/lib/users/validations";


export const getUsers = authenticatedAction.action(
  async ({ ctx: { userId } }) => {
      const data = await prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });

    return data;
  }
);
export const createUser = authenticatedAction
  .schema(createUserFormSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {

    const email = parsedInput.email;

    const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(parsedInput.password, 10)

    const user = await prisma.user.create({
      data: {
        name: parsedInput.name,
        email,
        password: hashedPassword,
        emailVerified: parsedInput.emailVerified,
        createdAt: parsedInput.createdAt,
        updatedAt: parsedInput.updatedAt
      },
    })
    
    revalidatePath("/endpoints");
    redirect("/endpoints");
  });

export const updateUser = authenticatedAction
  .schema(updateUserFormSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {

    const id = parsedInput.id;

    const email = parsedInput.email;
    const hashedPassword = await bcrypt.hash(parsedInput.password, 10)
    
    await prisma.user.update({
        where: { id },
        data: {
        name: parsedInput.name,
        email,
        password: hashedPassword,
        emailVerified: parsedInput.emailVerified,
        createdAt: parsedInput.createdAt,
        updatedAt: parsedInput.updatedAt
        },
    });

    revalidatePath("/endpoints");
    redirect("/endpoints");
  });

  export const deleteUser = authenticatedAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { userId } }) => {
    const existing = await prisma.user.findUnique({ where: { id } })

    if (existing) {
      if (!existing.isDeleted) {
        existing.isDeleted = true;

        await prisma.user.update({
          where: { id },
          data: existing,
        });
    
      revalidatePath("/endpoints");
      }
      else {
      revalidatePath("/endpoints");
      }
    }
  });

export const getUserById = authenticatedAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { userId } }) => {
    const user = await prisma.user.findUnique({
    where: { id },
  });

    return user;
});
