import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  getSessionCookieOptions,
  hashPassword,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeStringInput, validateEmail, validateName, validatePassword } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "auth");
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => null) as
      | { name?: string; email?: string; password?: string }
      | null;

    const nameValidation = validateName(normalizeStringInput(body?.name));
    if (!nameValidation.ok) {
      return NextResponse.json({ error: nameValidation.error }, { status: nameValidation.status });
    }

    const emailValidation = validateEmail(normalizeStringInput(body?.email));
    if (!emailValidation.ok) {
      return NextResponse.json({ error: emailValidation.error }, { status: emailValidation.status });
    }

    const password = typeof body?.password === "string" ? body.password : "";
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.ok) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: passwordValidation.status }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: emailValidation.data } });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        name: nameValidation.data,
        email: emailValidation.data,
        passwordHash: hashPassword(passwordValidation.data),
        role: userCount === 0 ? "ADMIN" : "USER",
      },
    });

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(expiresAt)
    );

    return response;
  } catch (error) {
    console.error("Sign up error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error";

    const isDbConnectionIssue =
      error instanceof Prisma.PrismaClientInitializationError ||
      /Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|P1001/i.test(
        errorMessage
      );

    if (isDbConnectionIssue) {
      return NextResponse.json(
        {
          error:
            "Database is currently unreachable. Please try again shortly or verify the database connection.",
          ...(process.env.NODE_ENV !== "production" ? { detail: errorMessage } : {}),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "A server error occurred during sign up.",
        ...(process.env.NODE_ENV !== "production" ? { detail: errorMessage } : {}),
      },
      { status: 500 }
    );
  }
}
