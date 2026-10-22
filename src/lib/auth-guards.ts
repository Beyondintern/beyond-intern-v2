import "server-only";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ADMIN_EMAILS } from "@/lib/admin-emails";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
};

/**
 * Administrator accounts. The built-in list is shared with the client admin
 * page via src/lib/admin-emails.ts, so the server-side guard and the UI gate
 * can never diverge even when ADMIN_EMAILS is unset in a deployment
 * environment. Emails in the ADMIN_EMAILS env var are merged on top.
 */
function configuredAdminEmails() {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv]);
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  const id = session?.user?.id;

  if (!email || !id) {
    throw new Error("Unauthorized");
  }

  return { id, email, name: session.user.name };
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!configuredAdminEmails().has(user.email)) {
    throw new Error("Forbidden");
  }
  return user;
}

export function isAuthError(error: unknown) {
  return error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden");
}
