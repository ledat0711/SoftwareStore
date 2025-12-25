'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { User } from "@prisma/client";
import UserTable from "@/components/user/UserTable";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <>
      <UserTable />
    </>
  );
}