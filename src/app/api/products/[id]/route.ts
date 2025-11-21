import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

// GET product by ID
export async function GET(
  req: Request,
  { params }: RouteContext
) {
  const product = await prisma.product.findUnique({
    where: { slug: params.id },
  });

  return NextResponse.json(product);
}

// UPDATE (PUT)
export async function PUT(
  req: Request,
  { params }: RouteContext
) {
  const body = await req.json();

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}

// UPDATE (PATCH)
export async function PATCH(
  req: Request,
  { params }: RouteContext
) {
  const body = await req.json();

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}

// DELETE product
export async function DELETE(
  req: Request,
  { params }: RouteContext
) {
  await prisma.product.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
