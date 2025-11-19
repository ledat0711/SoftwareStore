import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const takeParam = searchParams.get("take");
  const onlyVisible = searchParams.get("visible");

  const take = takeParam ? parseInt(takeParam) : undefined;

  const products = await prisma.product.findMany({
    where: {
      hidden: onlyVisible === "1" ? false : undefined,
    },
    take: typeof take === "number" && take > 0 ? take : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

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
