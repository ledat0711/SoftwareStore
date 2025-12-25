"use client";

import * as React from "react";

// type imports
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { updateUserFormSchema as formSchema } from "@/lib/users/validations";

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
import { User } from '@prisma/client'

import { useAction } from "next-safe-action/hooks";
import { updateUser } from "@/app/endpoints/action";

type DomainValues = z.infer<typeof formSchema>;

export default function EditForm({
  id,
  user,
}: {
  id: string;
  user: User;
}) {
  const { execute, isExecuting } = useAction(updateUser, {
    onSuccess() {
      toast.success("Endpoint updated successfully.");
    }
  });

  const defaultValues: Partial<DomainValues> = {
    id: id,
    name: user.name || "",
    email: user.email,
    password: user.password || "",
    emailVerified: user.emailVerified || new Date(),
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => execute(values))}>
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
                        <Input placeholder="••••••••" {...field} />
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

        <Button
          type="submit"
          variant="outline"
          className="mt-12"
          loading={isExecuting}
        >
          Update User
        </Button>
      </form>
    </Form>
  );
}
