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
