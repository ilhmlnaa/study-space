import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    const isAdmin = session?.user?.role === "ADMIN";
    const isMentor = session?.user?.role === "MENTOR";

    if (!isAdmin && !isMentor) {
      return NextResponse.json(
        { error: "You are not authorized to access this resource." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role")?.trim().toUpperCase();

    if (role && !Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { error: "Invalid role filter." },
        { status: 400 },
      );
    }

    // Mentors can only search for MODERATORs (for room assignment)
    if (isMentor && role && role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Mentors can only search for moderators." },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(role ? { role: role as Role } : {}),
      },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while fetching users." },
      { status: 500 },
    );
  }
}
