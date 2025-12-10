import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Product } from "@/types/product";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id: string } = await params;

  const product: Product | null = await prisma.product.findUnique({ where: { id: string } });
  if (!product) {
    return new NextResponse("Product not found", { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id: string } = await params;
  const body = await request.json();

  try {
    const updatedProduct: Product = await prisma.product.update({ where: { id: string }, data: body });
    return NextResponse.json(updatedProduct);
  } catch {
    return new NextResponse("Update failed", { status: 400 });
  }
}

export async function PATCH(
    req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updatedProduct: Product = await prisma.product.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updatedProduct);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse("Delete failed", { status: 400 });
  }
}