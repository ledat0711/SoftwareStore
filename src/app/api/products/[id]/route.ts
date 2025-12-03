import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return new NextResponse("Product not found", { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json();

  try {
    const updated = await prisma.product.update({ where: { id }, data: body });
    return NextResponse.json(updated);
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

  const updated = await prisma.product.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
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