"use client";

import { OrderItem } from '@prisma/client'
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/header";
import Link from "next/link";

export const columns: ColumnDef<OrderItem>[] = [
   {
    accessorKey: "image",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Image" />;
    },
    cell: ({ row }) => {
      const image: string = row.getValue("image");
      return (
        <Link
        href=""
        className="relative block"
      >
        <img
          src={image || ""}
          className="w-30 h-10 object-contain"
        />
      </Link>
      );
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Title" />;
    },
    cell: ({ row }) => {
      const title: string = row.getValue("title");
      return (
       <p>{title}</p>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Price" />;
    },
    cell: ({ row }) => {
      const price: string = row.getValue("price");
      return (
        <p>{price}</p>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Quantity" />;
    },
    cell: ({ row }) => {
      const quantity: string = row.getValue("quantity");
      return (
        <p>{quantity}</p>
      );
    },
  },
];
