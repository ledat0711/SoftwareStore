import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET product by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({
    where: { slug: params.id },   // hoặc id: params.id nếu bạn dùng id
  });

  return NextResponse.json(product);
}

// UPDATE (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.product.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

// UPDATE (PATCH)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.product.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

// DELETE product
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.product.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
