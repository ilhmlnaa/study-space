import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiAuth = pathname.startsWith("/api/auth");
  const isApiRegister = pathname.startsWith("/api/register");
  const isApiHealth = pathname.startsWith("/api/health");

  if (isPublicRoute || isApiAuth || isApiRegister || isApiHealth) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // Role-based route protection
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (pathname.startsWith("/mentor") && role !== "MENTOR") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (pathname.startsWith("/moderator") && role !== "MODERATOR") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Room access - any authenticated user can access
  if (pathname.startsWith("/room/")) {
    return NextResponse.next();
  }

  // API routes - require authentication
  if (pathname.startsWith("/api/") && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
