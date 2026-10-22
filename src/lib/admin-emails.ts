/**
 * Administrator accounts, shared by the client admin page and the server-side
 * guard so the two can never diverge. The server guard also merges in the
 * ADMIN_EMAILS env var on top of this list.
 *
 * This module must stay free of server-only imports so the client admin page
 * can import it safely.
 */
export const ADMIN_EMAILS: string[] = [
  "info@beyondintern.com",
  "ansupoddar11@gmail.com",
];
