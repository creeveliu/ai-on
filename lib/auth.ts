import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";

const ADMIN_COOKIE = "admin_token";

type AdminPayload = {
  adminId: string;
  email: string;
};

function jwtSecret() {
  return new TextEncoder().encode(getEnv().AUTH_JWT_SECRET);
}

export async function validateAdminCredentials(email: string, password: string) {
  const admin = await db.admin.findUnique({ where: { email } });

  if (!admin) {
    return null;
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return null;
  }

  return admin;
}

export async function signAdminToken(payload: AdminPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, jwtSecret());

  if (!payload.adminId || !payload.email) {
    throw new Error("Invalid admin token payload");
  }

  return {
    adminId: String(payload.adminId),
    email: String(payload.email),
  };
}

export async function setAdminSession(payload: AdminPayload) {
  const token = await signAdminToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
