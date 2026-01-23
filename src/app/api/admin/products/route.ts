import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/helpers";
import type { Product } from "@/types/product";

type ProductForm = Omit<Product, "id" | "isDeleted">;

const productSchema = z.object({
  slug: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  image: z.string().nullable(),
  price: z.number().finite().nonnegative(),
  rating: z.number().finite().min(0).max(5).nullable(),
  tag: z.string().nullable(),
  badge: z.string().nullable(),
  category: z.string().nullable(),
  platform: z.string().nullable(),
  hidden: z.boolean(),
});

const forbidden = NextResponse.json({ error: "Forbidden" }, { status: 403 });

function resolveSlug(
  slug: string | null | undefined,
  title: string | null | undefined,
) {
  const trimmed = typeof slug === "string" ? slug.trim() : "";
  if (trimmed) return trimmed;
  if (typeof title === "string" && title.trim()) {
    return slugify(title);
  }
  return "";
}

export async function GET() {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden;
  }

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden;
  }

  const parsedBody = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const slug = resolveSlug(parsedBody.data.slug, parsedBody.data.title);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const payload: ProductForm = {
    ...parsedBody.data,
    slug,
  };

  const created = await prisma.product.create({
    data: {
      ...payload,
    },
  });
  return NextResponse.json({ product: created });
}
