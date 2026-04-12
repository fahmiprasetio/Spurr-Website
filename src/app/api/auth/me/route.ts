import { NextRequest, NextResponse } from "next/server";
import {
  getExpiredCookieOptions,
  getUserBySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { hasAdminAccess } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserBySessionToken(token);

  if (!user) {
    const response = NextResponse.json({ user: null });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      "",
      getExpiredCookieOptions()
    );
    return response;
  }

  const isAdmin = await hasAdminAccess(user.id, user.role);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: isAdmin ? "ADMIN" : user.role,
    },
  });
}
