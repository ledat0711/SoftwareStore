"use client";

import * as React from "react";

// type imports
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";

import { createUserFormSchema as formSchema } from "@/lib/users/validations";

// UI Imports
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createUser } from "@/app/admin/users/action";

type DomainValues = z.infer<typeof formSchema>;

const defaultValues: Partial<DomainValues> = {
  name: "",
  email: "",
  password: "",
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function CreateForm() {
  const router = useRouter();
  const { execute, isExecuting } = useAction(createUser, {
    onSuccess() {
      toast.success("User created successfully.");
      router.push("/users");
    },
    onError({ error }) {
      toast.error("User already exists");
      router.push("/users");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => execute(values))} >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl className="bg-secondary">
                <Input placeholder="John..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

         <div className="border-y py-6 my-6 grid gap-2">
          <div className="grid grid-cols-2 items-start w-full gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl className="bg-secondary">
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl className="bg-secondary">
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
            </div>
        </div>

         <div className="border-y py-6 my-6 grid gap-2">
          <div className="grid grid-cols-2 items-start w-full gap-4">
              <FormField
                control={form.control}
                name="emailVerified"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Verified</FormLabel>
                    <FormControl className="bg-secondary">
                      <Input type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
          control={form.control}
          name="createdAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Created At</FormLabel>
              <FormControl className="bg-secondary">
                <Input type={"date"} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
            </div>
        </div>

        <FormField
          control={form.control}
          name="updatedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Updated At</FormLabel>
              <FormControl className="bg-secondary">
                <Input type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-12" variant="outline" loading={isExecuting}>
          Create User
        </Button>
      </form>
    </Form>
  );
}
