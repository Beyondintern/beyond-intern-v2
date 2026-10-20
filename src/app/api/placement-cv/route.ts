import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Admin-only signed download for a student's CV. CVs live in the private
 * `placement-cvs` bucket; this route mints a short-lived signed URL so the
 * file is never publicly reachable.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("id");
  if (!assignmentId) {
    return NextResponse.json({ error: "Missing assignment id" }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("internship_assignments")
      .select("cv_url")
      .eq("id", assignmentId)
      .single();

    if (error || !data?.cv_url) {
      return NextResponse.json({ error: "No CV on file" }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("placement-cvs")
      .createSignedUrl(data.cv_url, 300);

    if (signError || !signed?.signedUrl) {
      throw signError ?? new Error("signing failed");
    }

    return NextResponse.redirect(signed.signedUrl);
  } catch (error) {
    console.error("placement-cv route error:", error);
    return NextResponse.json({ error: "Could not retrieve CV" }, { status: 500 });
  }
}
