"use server";

import  prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { success, z } from "zod";
import { authenticatedAction } from "@/lib/users/safe-action";
import { createUserFormSchema } from "@/lib/users/validations";
import { updateUserFormSchema } from "@/lib/users/validations";
import { OrderStatus } from "@prisma/client";

export const getUsers = authenticatedAction
.action(
  async ({ parsedInput, ctx: { userId } }) => {
      const data = await prisma.user.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: "desc" },
    });

    return data;
  }
);

  export const createOrderItem = authenticatedAction
  .action(async () => {
    const orderItem = await prisma.orderItem.create({
        data: {
          orderId: "cmk48ma4w0002vkxswih0h4on",
          productId: "cmk48w30e0004vkxs9zrqjyvl",
          title: "Title 2",
          image: "https://duhung.vn/wp-content/uploads/2024/01/Microsoft-Office-2021-Professional-Plus.jpg",
          price: 1000,
          quantity: 2
        },
      })
  });

  // export const createOrder = authenticatedAction
  // .action(async () => {
  //   prisma.order
  //   const cart = await prisma.order.create({
  //       data: {
  //         userId: "cmk48ku210000vkxsv3e2d5bh",
  //         status: OrderStatus.PENDING,
  //         totalAmount: 5
  //       },
  //     })
  // });

 

  // export const createOrder = authenticatedAction
  // .action(async () => {
  //   allProducts.map(async product => {
  //     const cart = await prisma.product.create({
  //         data: {
  //           slug: product.slug,
  // title: product.title,
  // description: product.description,
  // image: product.image,
  // price: product.price,
  // rating: product.rating,
  // tag: product.tag,
  // badge: product.badge,
  // hidden: product.hidden
  //         },
  //       })

  //   })
  // });



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
    
    // revalidatePath("/endpoints");
    // redirect("/endpoints");

    return { success: true };
  });

export const updateUser = authenticatedAction
  .schema(updateUserFormSchema)
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const email = parsedInput.email;

    const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) throw new Error("User already exists");

    const id = parsedInput.id;
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

    // revalidatePath("/endpoints");
    // redirect("/endpoints");

    return { success: true };
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
    
        revalidatePath("/users");
      }
      else {
        revalidatePath("/users");
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
