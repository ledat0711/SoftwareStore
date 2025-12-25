"use client";

import { User } from '@prisma/client'
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/header";
import { Badge } from "@/components/ui/badge";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import Link from "next/link";
import OptionsDropdown from "./options-dropdown";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
    cell: ({ row }) => {
      const name: string = row.getValue("name");
      return (
        <p>{name}</p>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Email" />;
    },
    cell: ({ row }) => {
      const email: string = row.getValue("email");
      return (
        <p>{email}</p>
      );
    },
  },
  {
    accessorKey: "emailVerified",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Email Verified" />;
    },
    cell: ({ row }) => {
      const emailVerified: string = new Date(row.getValue("emailVerified") || '').toLocaleString();
      return (
       <p>{emailVerified}</p>
      );
    },
  },
   {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Created At" />;
    },
    cell: ({ row }) => {
      const createdAt: string = new Date(row.getValue("createdAt") || '').toLocaleString();
      return (
       <p>{createdAt}</p>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Updated At" />;
    },
    cell: ({ row }) => {
      const updatedAt: string = new Date(row.getValue("updatedAt") || '').toLocaleString();
      return (
       <p>{updatedAt}</p>
      );
    },
  },
  {
    accessorKey: "options",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Options" />;
    },
    cell: ({ row }) => {
      const id: string = row.original.id;
      return <OptionsDropdown id={id} />;
    },
    enableSorting: false,
  },
];
