import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET ALL PRODUCTS
export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

// CREATE PRODUCT
export async function POST(req: Request) {
  const body = await req.json();

  const created = await prisma.product.create({
    data: {
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, "-"),
      title: body.title,
      description: body.description ?? "",
      image: body.image,
      price: body.price,
      rating: body.rating ?? null,
      category: body.category ?? null,
      badge: body.badge ?? null,
      department: body.department,
      platform: body.platform,
      hidden: body.hidden ?? false,
    },
  });

  return NextResponse.json(created);
}