import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/helpers";
import { revalidatePath } from "next/cache";

const updateSchema = z
  .object({
    slug: z.string().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    price: z.number().finite().nonnegative().optional(),
    rating: z.number().finite().min(0).max(5).optional().nullable(),
    tag: z.string().optional().nullable(),
    badge: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    platform: z.string().optional().nullable(),
    hidden: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Empty payload",
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const parsedBody = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: { slug: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const data = { ...parsedBody.data };
  const slugProvided = Object.prototype.hasOwnProperty.call(data, "slug");
  const titleProvided = Object.prototype.hasOwnProperty.call(data, "title");

  if (slugProvided || titleProvided) {
    const resolvedSlug = resolveSlug(
      slugProvided ? data.slug : undefined,
      titleProvided ? data.title : undefined,
    );
    if (!resolvedSlug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    data.slug = resolvedSlug;
  } else {
    delete data.slug;
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath(`/products/${updated.slug}`);
  if (existing.slug && existing.slug !== updated.slug) {
    revalidatePath(`/products/${existing.slug}`);
  }
  return NextResponse.json({ product: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session: Session | null = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return forbidden;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const existing = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: { slug: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath(`/admin/products/${id}/edit`);
  if (existing.slug) {
    revalidatePath(`/products/${existing.slug}`);
  }
  return NextResponse.json({ ok: true });
}
