"use server";

import  prisma from "@/lib/prisma";
import { User } from '@prisma/client'
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function getUsers() {
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(formData: FormData): Promise<void> {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const emailVerifiedStr = formData.get("emailVerified") as string
    const emailVerified = emailVerifiedStr ? new Date(emailVerifiedStr) : null;
    const createdAtStr = formData.get("createdAt") as string
    const createdAt = createdAtStr ? new Date(createdAtStr) : null;
    const updatedAtStr = formData.get("updatedAt") as string
    const updatedAt = updatedAtStr ? new Date(updatedAtStr) : null;

  if (!email || !password || !name || !emailVerified || !createdAt || !updatedAt) redirect("/users/create");
    
    const hashedPassword = await bcrypt.hash(password, 10)
  
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new Error("User already exists");
  
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(id: string, formData: FormData): Promise<void> {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const emailVerifiedStr = formData.get("emailVerified") as string
    const emailVerified = emailVerifiedStr ? new Date(emailVerifiedStr) : null;
    const createdAtStr = formData.get("createdAt") as string
    const createdAt = createdAtStr ? new Date(createdAtStr) : null;
    const updatedAtStr = formData.get("updatedAt") as string
    const updatedAt = updatedAtStr ? new Date(updatedAtStr) : null;

    if (!email || !password || !name || !emailVerified || !createdAt || !updatedAt) redirect(`/users/${id}/edit`);

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
        where: { id },
        data: {
            name,
            email,
            password: hashedPassword,
            emailVerified,
            createdAt,
            updatedAt,
        },
    });

    revalidatePath("/users");
    redirect("/users");
}

export async function deleteUser(id: string) {
  // try {
  //   const existing = await prisma.user.findUnique({ where: { id } })

  //   if (existing) {
  //     if (!existing.isDeleted) {
  //       existing.isDeleted = true;

  //       await prisma.user.update({
  //         where: { id },
  //         data: existing,
  //       });
    
  //       revalidatePath("/users");
  //       redirect("/users");
  //     }
  //     else {
  //       redirect(`/users/${id}/delete`);
  //     }
  //   }
  // }
  // catch (error) {
  //   redirect(`/users/${id}/delete`);
  // }

  const existing = await prisma.user.findUnique({ where: { id } })

  if (existing) {
    if (!existing.isDeleted) {
      existing.isDeleted = true;

      await prisma.user.update({
        where: { id },
        data: existing,
      });
  
      revalidatePath("/users");
      redirect("/users");
    }
    else {
      redirect(`/users/${id}/delete`);
    }
  }
}

export async function getUserById(id:string) {
  const user : User | null = await prisma.user.findUnique({
    where: { id },
  });

  return user;
}
