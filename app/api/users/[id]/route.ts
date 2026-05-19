import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function requireAdmin() {
  const session = await auth();

  return session?.user?.role === "ADMIN";
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to access this resource." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const role = typeof body.role === "string" ? body.role.toUpperCase() : null;

    if (!role || !Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to update user:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while updating the user." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to access this resource." },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Failed to delete user:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the user." },
      { status: 500 },
    );
  }
}
