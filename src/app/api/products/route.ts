import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/helpers";
import { Product } from "@/types/product";

export async function GET(req: Request) {
  const { searchParams }: { searchParams: URLSearchParams } = new URL(req.url);
  const takeParam: string | null = searchParams.get("take");
  const onlyVisible: string | null = searchParams.get("visible");

  const take: number | undefined = takeParam ? parseInt(takeParam) : undefined;

  const products: Product[] = await prisma.product.findMany({
    where: {
      hidden: onlyVisible === "1" ? false : undefined,
    },
    take: typeof take === "number" && take > 0 ? take : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body: Product = await req.json();
  const slug = body.slug || slugify(body.title);

  const created: Product = await prisma.product.create({
    data: {
      slug,
      title: body.title,
      description: body.description ?? "",
      image: body.image,
      price: body.price,
      rating: body.rating ?? null,
      tag: body.tag ?? null,
      badge: body.badge ?? null,
      category: body.category,
      platform: body.platform,
      hidden: body.hidden ?? false,
    },
  });

  return NextResponse.json(created);
}
