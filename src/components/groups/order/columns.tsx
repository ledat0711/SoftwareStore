"use client";

import { Order } from '@prisma/client'
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/header";

import OptionsDropdown from './options-dropdown';

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="ID" />;
    },
    cell: ({ row }) => {
      const id: string = row.getValue("id");
      return (
        <p>{id}</p>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Date" />;
    },
    cell: ({ row }) => {
      const createdAt: string = new Date(row.getValue("createdAt") || '').toLocaleString();
      return (
       <p>{createdAt}</p>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Total" />;
    },
    cell: ({ row }) => {
      const total: string = row.getValue("totalAmount");
      return (
        <p>{total}</p>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Status" />;
    },
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      return (
        <p>{status}</p>
      );
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Action" />;
    },
    cell: ({ row }) => {
      const id: string = row.original.id;
      return <OptionsDropdown id={id} />;
    },
    enableSorting: false,
  },
];
