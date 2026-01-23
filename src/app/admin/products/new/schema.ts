import { z } from "zod";

const money = z
  .number()
  .finite()
  .nonnegative()
  .max(1_000_000);

const rating = z
  .number()
  .finite()
  .min(0)
  .max(5)
  .optional()
  .nullable();

export const productCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  category: z.string().trim().min(1),
  platform: z.string().trim().min(1),
  badge: z.string().trim().optional().nullable(),
  hidden: z.boolean().default(false),
  description: z.string().trim().optional().nullable(),
  image: z.string().trim().url("Invalid image URL").optional().nullable(),
  price: money,
  rating,
  tag: z.string().trim().optional().nullable(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
