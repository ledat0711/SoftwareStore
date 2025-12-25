import { z } from "zod";

export const deleteLogSchema = z.object({
  id: z.string(),
});

export const getLeadDataSchema = z.object({
  id: z.string(),
});

export const createUserFormSchema = z.object({
  name: z.string().min(1, "Not a valid name."),
  email: z.string().email("Not a valid email.").min(1, "Not a valid email."),
  password: z.string().min(1, "Not a valid password."),
  emailVerified: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const updateUserFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Not a valid name."),
  email: z.string().email("Not a valid email.").min(1, "Not a valid email."),
  password: z.string().min(1, "Not a valid password."),
  emailVerified: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
