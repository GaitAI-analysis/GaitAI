import { cookies } from "next/headers";

const COOKIE_NAME = "gaitai_admin";
const DEFAULT_PASSWORD = "gaitai-admin";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function isAuthed(): boolean {
  const cookieStore = cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value === getAdminPassword();
}

export function setAuthCookie(): void {
  cookies().set(COOKIE_NAME, getAdminPassword(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(): void {
  cookies().delete(COOKIE_NAME);
}
