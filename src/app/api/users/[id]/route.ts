'use server';

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  return NextResponse.json({user});
}

// PUT /api/users/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { name, email, password, emailVerified, image, updatedAt } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { 
        name, 
        email,
        password,
        emailVerified,
        image,
        updatedAt
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error editing user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error deleting user" },
      { status: 500 }
    );
  }
}
