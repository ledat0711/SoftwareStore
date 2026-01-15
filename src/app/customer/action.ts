"use server";

import  prisma from "@/lib/prisma";
import { z } from "zod";
import { authenticatedAction } from "@/lib/users/safe-action";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/auth";
import { revalidatePath } from 'next/cache';
import { convertToPlainObject, formatError } from "@/lib/utils";
import { paypal } from "@/lib/paypal";
import { getUserById } from "../admin/users/action";

export const getOrders = authenticatedAction.action(
  async ({ ctx: { userId } }) => {
  //   const data = await prisma.product.findMany({
  //     where: {
  //       cartItems: {
  //         some: {
  //           cart: {
  //             userId: userId,
  //           },
  //         },
  //       },
  //     },
  // })

    const data = await prisma.order.findMany({
      where: {
        userId: userId,
      },
    });

    return data;
  }
);

export const getOrderItems = authenticatedAction
.schema(z.object({ id: z.string() }))
.action(async ({ parsedInput, ctx: { userId } }) => {

 const id = parsedInput.id;

  const data = await prisma.orderItem.findMany({
      where: {
        orderId: id
      },
    });

    return data;
  }
);



