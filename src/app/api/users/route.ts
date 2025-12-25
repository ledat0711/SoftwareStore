'use server';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const usersPerPage = 10;
  const offset = (page - 1) * usersPerPage;

  // Fetch paginated posts
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    skip: offset,
    take: usersPerPage,
    orderBy: { createdAt: "desc" },
  });

  const totalUsers = await prisma.user.count();
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return NextResponse.json({ users, totalPages });
}