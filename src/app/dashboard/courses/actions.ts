"use server";

import { requireUser } from "@/lib/auth-guards";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function getUserCourses() {
  try {
    const user = await requireUser();
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userCourses, error } = await supabaseAdmin
      .from("user_courses")
      .select("course_id, created_at")
      .eq("user_email", user.email);

    if (error) throw error;
    if (!userCourses || userCourses.length === 0) return [];

    const courseIds = userCourses.map((uc) => uc.course_id);
    const { data: rawCourses, error: courseError } = await supabaseAdmin
      .from("raw_courses")
      .select("*")
      .in("id", courseIds);

    if (courseError) throw courseError;

    const coursesMap = new Map(rawCourses?.map((c) => [c.id, c]) || []);
    return userCourses
      .map((uc) => {
        const courseDetails = coursesMap.get(uc.course_id);
        if (!courseDetails) return null;
        return { ...courseDetails, enrolledAt: uc.created_at };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
}

export interface CourseSearchResult {
  id: string;
  title: string;
  category: string;
}

/**
 * Course titles/categories for the dashboard predictive search.
 * Available to any authenticated user (no admin required).
 */
export async function searchCourses(): Promise<CourseSearchResult[]> {
  try {
    await requireUser();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("raw_courses")
      .select("id, title, category");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Search courses error:", error);
    return [];
  }
}

export async function checkEnrollment(courseId: string): Promise<boolean> {
  try {
    const user = await requireUser();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("user_courses")
      .select("course_id")
      .eq("user_email", user.email)
      .eq("course_id", courseId)
      .limit(1);

    if (error) throw error;
    return Boolean(data?.length);
  } catch (error) {
    console.error("Check enrollment error:", error);
    return false;
  }
}

export interface MyInternship {
  assignment_id: string;
  id: string;
  company: string;
  role: string;
  listing_type: string;
  location: string | null;
  employment_type: string | null;
  pay_rate: string | null;
  experience: string | null;
  shift: string | null;
  description: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  benefits: string[] | null;
  service_fee: string | null;
  assigned_at: string;
  status: string;
  receipt_number: string | null;
  amount_paid: string | null;
  cv_url: string | null;
  cv_file_name: string | null;
  cv_submitted_at: string | null;
  candidate_notes: string | null;
  admin_notes: string | null;
}

/**
 * Placements assigned to the signed-in student, with their pipeline status,
 * receipt and CV state. Identity comes from the session, never a client argument.
 */
export async function getMyInternships(): Promise<MyInternship[]> {
  try {
    const user = await requireUser();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("internship_assignments")
      .select("id, assigned_at, status, receipt_number, amount_paid, cv_url, cv_file_name, cv_submitted_at, candidate_notes, admin_notes, internships!inner(*)")
      .eq("user_email", user.email)
      .order("assigned_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => {
      const internship = Array.isArray(row.internships) ? row.internships[0] : row.internships;
      return {
        ...(internship as Record<string, unknown>),
        assignment_id: row.id,
        assigned_at: row.assigned_at,
        status: row.status,
        receipt_number: row.receipt_number,
        amount_paid: row.amount_paid,
        cv_url: row.cv_url,
        cv_file_name: row.cv_file_name,
        cv_submitted_at: row.cv_submitted_at,
        candidate_notes: row.candidate_notes,
        admin_notes: row.admin_notes,
      };
    }) as MyInternship[];
  } catch (error) {
    console.error("Get my internships error:", error);
    return [];
  }
}

const CV_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const CV_EXTENSIONS = ["pdf", "doc", "docx"] as const;

/**
 * Upload or replace the signed-in student's CV for one of their assignments.
 * Identity is derived from the session; the assignment must belong to them.
 */
export async function uploadPlacementCv(formData: FormData) {
  try {
    const user = await requireUser();
    const supabaseAdmin = getSupabaseAdmin();

    const assignmentId = String(formData.get("assignment_id") ?? "");
    const candidateNotes = String(formData.get("candidate_notes") ?? "").trim();
    const file = formData.get("cv");

    if (!assignmentId) return { success: false, message: "Missing assignment reference." };
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Choose a CV file to upload." };
    }
    if (file.size > CV_MAX_BYTES) {
      return { success: false, message: "CV must be 10MB or smaller." };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!CV_EXTENSIONS.includes(ext as (typeof CV_EXTENSIONS)[number])) {
      return { success: false, message: "CV must be a PDF, DOC, or DOCX file." };
    }

    // Scope strictly to the student's own assignment.
    const { data: assignment, error: lookupError } = await supabaseAdmin
      .from("internship_assignments")
      .select("id, status")
      .eq("id", assignmentId)
      .eq("user_email", user.email)
      .single();
    if (lookupError || !assignment) {
      return { success: false, message: "Placement not found for your account." };
    }

    const fileName = `${user.email}/${assignmentId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("placement-cvs")
      .upload(fileName, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
    if (uploadError) {
      console.error("CV storage error:", uploadError);
      return { success: false, message: "Could not save your CV. Please try again." };
    }

    const now = new Date().toISOString();
    const nextStatus = assignment.status === "assigned" ? "cv_submitted" : assignment.status;
    const { error: updateError } = await supabaseAdmin
      .from("internship_assignments")
      .update({
        cv_url: fileName,
        cv_file_name: file.name,
        cv_submitted_at: now,
        candidate_notes: candidateNotes || null,
        status: nextStatus,
      })
      .eq("id", assignmentId);
    if (updateError) throw updateError;

    if (assignment.status === "assigned") {
      await supabaseAdmin.from("notifications").insert({
        title: "CV received",
        message: "Thanks — your CV has been received and your application is now under review.",
        type: "direct",
        target_email: user.email,
      });
    }

    return { success: true, message: "CV uploaded successfully." };
  } catch (error) {
    console.error("Upload placement CV error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

/**
 * Short-lived signed URL so the student (or admin) can view a private CV.
 */
export async function getPlacementCvUrl(assignmentId: string) {
  try {
    const user = await requireUser();
    const supabaseAdmin = getSupabaseAdmin();
    const { data: assignment } = await supabaseAdmin
      .from("internship_assignments")
      .select("cv_url")
      .eq("id", assignmentId)
      .eq("user_email", user.email)
      .single();
    if (!assignment?.cv_url) return { url: null };
    const { data, error } = await supabaseAdmin.storage
      .from("placement-cvs")
      .createSignedUrl(assignment.cv_url, 300);
    if (error) throw error;
    return { url: data.signedUrl };
  } catch (error) {
    console.error("Get CV url error:", error);
    return { url: null };
  }
}
