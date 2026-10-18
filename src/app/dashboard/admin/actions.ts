"use server";

import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { courseData } from "@/lib/courses";

const CATEGORY_IMAGES: Record<string, string> = {
  "Technical Skills": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
  "Analytical Skills": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  "Marketing & Sales": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  "Professional & Soft Skills": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
  "Finance & Investment": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  "Creative Skills": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  "Career Readiness": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
};

async function guardAdmin() { await requireAdmin(); }

export async function assignCourse(email: string, courseId: string) {
  await guardAdmin();
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabaseAdmin.from("user_courses").insert({ user_email: normalizedEmail, course_id: courseId });
    if (error) {
      if (error.code === "23505") return { success: false, message: "This user is already enrolled in that course." };
      throw error;
    }
    const { data: course } = await supabaseAdmin.from("raw_courses").select("title").eq("id", courseId).single();
    if (course) await supabaseAdmin.from("notifications").insert({ title: "Course Enrollment", message: `Welcome! Thank you for enrolling in ${course.title}!`, type: "direct", target_email: normalizedEmail });
    return { success: true };
  } catch (error) {
    console.error("Assign error:", error);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}

export async function upsertCourse(formData: FormData) {
  await guardAdmin();
  try {
    const id = String(formData.get("id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const duration = String(formData.get("duration") ?? "").trim();
    const level = String(formData.get("level") ?? "").trim();
    const outcomes = String(formData.get("outcomes") ?? "").trim();
    const price = String(formData.get("price") ?? "").trim();
    let imageUrl = String(formData.get("image_url") ?? "").trim();
    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      if (file.size > 500 * 1024 || !file.type.startsWith("image/")) return { success: false, message: "Upload a valid image under 500KB." };
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) return { success: false, message: "Unsupported image format." };
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage.from("course_images").upload(fileName, file, { contentType: file.type });
      if (uploadError) return { success: false, message: "Failed to upload image." };
      imageUrl = supabaseAdmin.storage.from("course_images").getPublicUrl(fileName).data.publicUrl;
    }
    const parseJson = (key: string, fallback: unknown) => { const raw = formData.get(key); if (!raw) return fallback; try { return JSON.parse(String(raw)); } catch { return fallback; } };
    const { error } = await supabaseAdmin.from("raw_courses").upsert({ id, title, description, category, duration, level, outcomes, price: price || null, image_url: imageUrl || null, curriculum: parseJson("curriculum", []), video_modules: parseJson("video_modules", []), curriculum_syllabus: parseJson("curriculum_syllabus", []), schedule_text: String(formData.get("schedule_text") ?? "").trim() || null, assignment_link: String(formData.get("assignment_link") ?? "").trim() || null, career_outcomes: parseJson("career_outcomes", []), prerequisites: String(formData.get("prerequisites") ?? "").trim() || null, faqs: parseJson("faqs", []), schedule: parseJson("schedule", {}) }, { onConflict: "id" });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Upsert course error:", error);
    return { success: false, message: "Failed to publish course. Please try again." };
  }
}

export async function deleteCourse(courseId: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("raw_courses").delete().eq("id", courseId); if (error) throw error; return { success: true }; } catch (error) { console.error("Delete course error:", error); return { success: false, message: "Failed to remove course." }; } }
export async function fetchAllCourses() { await guardAdmin(); try { const { data, error } = await supabaseAdmin.from("raw_courses").select("*").order("created_at", { ascending: false }); if (error) throw error; return data || []; } catch (error) { console.error("Fetch courses error:", error); return []; } }
export async function fetchRegisteredUsers() { await guardAdmin(); try { const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }); if (error) throw error; return (data?.users || []).map((user) => ({ id: user.id, email: user.email || "No email", created_at: user.created_at })); } catch (error) { console.error("Fetch users error:", error); return []; } }
export async function fetchActiveEnrollments() { await guardAdmin(); try { const { data, error } = await supabaseAdmin.from("user_courses").select("*").order("created_at", { ascending: false }); if (error) throw error; return data || []; } catch (error) { console.error("Fetch enrollments error:", error); return []; } }
export async function migrateHardcodedCourses() { await guardAdmin(); try { const rows = courseData.map((course) => ({ id: course.id, title: course.title, description: course.description, category: course.category, duration: course.duration, level: course.level, outcomes: course.outcomes.join("\n"), image_url: CATEGORY_IMAGES[course.category] || null, curriculum: null })); const { error } = await supabaseAdmin.from("raw_courses").upsert(rows, { onConflict: "id" }); if (error) throw error; return { success: true, count: rows.length }; } catch (error) { console.error("Migration error:", error); return { success: false, message: "Migration failed. Check console for details." }; } }

export async function upsertWebinar(data: { id?: string; title: string; speaker: string; webinar_date: string; webinar_time: string }) { await guardAdmin(); try { if (data.id) { const { error } = await supabaseAdmin.from("webinars").update({ title: data.title.trim(), speaker: data.speaker.trim(), webinar_date: data.webinar_date.trim(), webinar_time: data.webinar_time.trim(), is_active: true }).eq("id", data.id); if (error) throw error; } else { await supabaseAdmin.from("webinars").update({ is_active: false }).eq("is_active", true); const { error } = await supabaseAdmin.from("webinars").insert({ title: data.title.trim(), speaker: data.speaker.trim(), webinar_date: data.webinar_date.trim(), webinar_time: data.webinar_time.trim(), is_active: true }); if (error) throw error; } return { success: true }; } catch (error) { console.error("Upsert webinar error:", error); return { success: false, message: "Failed to save webinar." }; } }
export async function getActiveWebinar() { try { const { data, error } = await supabaseAdmin.from("webinars").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1).single(); if (error && error.code !== "PGRST116") throw error; return data ?? null; } catch (error) { console.error("Get active webinar error:", error); return null; } }
export async function getWebinarRegistrations() { await guardAdmin(); try { const { data, error } = await supabaseAdmin.from("webinar_registrations").select("id, full_name, email, created_at, webinar_id").order("created_at", { ascending: false }); if (error) throw error; return data || []; } catch (error) { console.error("Get registrations error:", error); return []; } }
export async function registerForWebinar(formData: { full_name: string; email: string }) { try { const webinar = await getActiveWebinar(); if (!webinar) return { success: false, message: "No active webinar found. Please try again later." }; const { error } = await supabaseAdmin.from("webinar_registrations").insert({ webinar_id: webinar.id, full_name: formData.full_name.trim(), email: formData.email.trim().toLowerCase() }); if (error?.code === "23505") return { success: false, message: "You are already registered for this webinar!" }; if (error) throw error; return { success: true }; } catch (error) { console.error("Register for webinar error:", error); return { success: false, message: "Registration failed. Please try again." }; } }
export async function sendNotification(data: { title: string; message: string; type: "broadcast" | "direct"; course_id?: string; target_email?: string }) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("notifications").insert({ title: data.title.trim(), message: data.message.trim(), type: data.type, course_id: data.type === "broadcast" ? data.course_id : null, target_email: data.type === "direct" ? data.target_email?.toLowerCase().trim() : null }); if (error) throw error; return { success: true }; } catch (error) { console.error("Send notification error:", error); return { success: false, message: "Failed to send notification." }; } }
export async function fetchNotifications() { try { const user = await requireUser(); const { data: enrollments } = await supabaseAdmin.from("user_courses").select("course_id").eq("user_email", user.email); const ids = (enrollments || []).map((enrollment) => enrollment.course_id); const conditions = [`target_email.eq.${user.email}`]; if (ids.length) conditions.push(`course_id.in.(${ids.join(",")})`); const { data, error } = await supabaseAdmin.from("notifications").select("*").or(conditions.join(",")).order("created_at", { ascending: false }); if (error) throw error; return data || []; } catch (error) { console.error("Fetch notifications error:", error); return []; } }

export interface CarouselImageRow { id: string; image_url: string; orientation: "landscape" | "portrait"; created_at: string; }
export async function fetchCarouselImages(): Promise<CarouselImageRow[]> { try { const { data, error } = await supabaseAdmin.from("carousel_images").select("*").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as CarouselImageRow[]; } catch (error) { console.error("Fetch carousel images error:", error); return []; } }
export async function insertCarouselImage(image_url: string, orientation: "landscape" | "portrait") { await guardAdmin(); try { const { error } = await supabaseAdmin.from("carousel_images").insert({ image_url: image_url.trim(), orientation }); if (error) throw error; return { success: true }; } catch (error) { console.error("Insert carousel image error:", error); return { success: false, message: "Failed to add carousel image." }; } }
export async function deleteCarouselImage(id: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("carousel_images").delete().eq("id", id); if (error) throw error; return { success: true }; } catch (error) { console.error("Delete carousel image error:", error); return { success: false, message: "Failed to delete carousel image." }; } }
export interface BrandPartnerRow { id: string; name: string; website_link: string; logo_url?: string; created_at: string; }
export async function fetchBrandPartners(): Promise<BrandPartnerRow[]> { try { const { data, error } = await supabaseAdmin.from("brand_partners").select("*").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as BrandPartnerRow[]; } catch (error) { console.error("Fetch brand partners error:", error); return []; } }
export async function insertBrandPartner(name: string, website_link: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("brand_partners").insert({ name: name.trim(), website_link: website_link.trim() }); if (error) throw error; return { success: true }; } catch (error) { console.error("Insert brand partner error:", error); return { success: false, message: "Failed to add brand partner." }; } }
export async function deleteBrandPartner(id: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("brand_partners").delete().eq("id", id); if (error) throw error; return { success: true }; } catch (error) { console.error("Delete brand partner error:", error); return { success: false, message: "Failed to delete brand partner." }; } }
export interface PressArticleRow { id: string; publisher_name: string; article_link: string; created_at: string; }
export async function fetchPressArticles(): Promise<PressArticleRow[]> { try { const { data, error } = await supabaseAdmin.from("press_articles").select("*").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as PressArticleRow[]; } catch (error) { console.error("Fetch press articles error:", error); return []; } }
export async function insertPressArticle(publisher_name: string, article_link: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("press_articles").insert({ publisher_name: publisher_name.trim(), article_link: article_link.trim() }); if (error) throw error; return { success: true }; } catch (error) { console.error("Insert press article error:", error); return { success: false, message: "Failed to add press article." }; } }
export async function deletePressArticle(id: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("press_articles").delete().eq("id", id); if (error) throw error; return { success: true }; } catch (error) { console.error("Delete press article error:", error); return { success: false, message: "Failed to delete press article." }; } }

export interface InternshipRow {
  id: string;
  company: string;
  role: string;
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
  is_active: boolean;
  created_at: string;
}

interface InternshipInput {
  id?: string;
  company: string;
  role: string;
  location: string;
  employment_type: string;
  pay_rate: string;
  experience: string;
  shift: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  service_fee: string;
  is_active: boolean;
}

function parseInternshipInput(data: InternshipInput) {
  const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    company: data.company.trim(),
    role: data.role.trim(),
    location: data.location.trim() || null,
    employment_type: data.employment_type.trim() || null,
    pay_rate: data.pay_rate.trim() || null,
    experience: data.experience.trim() || null,
    shift: data.shift.trim() || null,
    description: data.description.trim() || null,
    responsibilities: lines(data.responsibilities),
    requirements: lines(data.requirements),
    benefits: lines(data.benefits),
    service_fee: data.service_fee.trim() || null,
    is_active: data.is_active,
  };
}

export async function upsertInternship(data: InternshipInput) {
  await guardAdmin();
  try {
    const parsed = parseInternshipInput(data);
    if (!parsed.company || !parsed.role) return { success: false, message: "Company and role are required." };
    if (data.id) {
      const { error } = await supabaseAdmin.from("internships").update(parsed).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("internships").insert(parsed);
      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    console.error("Upsert internship error:", error);
    return { success: false, message: "Failed to save internship." };
  }
}

export async function deleteInternship(id: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("internships").delete().eq("id", id); if (error) throw error; return { success: true }; } catch (error) { console.error("Delete internship error:", error); return { success: false, message: "Failed to delete internship." }; } }
export async function fetchInternships(): Promise<InternshipRow[]> { try { const { data, error } = await supabaseAdmin.from("internships").select("*").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as InternshipRow[]; } catch (error) { console.error("Fetch internships error:", error); return []; } }

export interface InternshipAssignmentRow { id: string; user_email: string; internship_id: string; assigned_at: string; internship: { company: string; role: string } | null; }
export async function assignInternship(email: string, internshipId: string) { await guardAdmin(); try { const normalizedEmail = email.trim().toLowerCase(); const { error } = await supabaseAdmin.from("internship_assignments").insert({ user_email: normalizedEmail, internship_id: internshipId }); if (error) { if (error.code === "23505") return { success: false, message: "This user is already assigned to that internship." }; throw error; } const { data: internship } = await supabaseAdmin.from("internships").select("company, role").eq("id", internshipId).single(); if (internship) await supabaseAdmin.from("notifications").insert({ title: "Internship Assignment", message: `You have been assigned to the ${internship.role} internship at ${internship.company}. Check your dashboard for details.`, type: "direct", target_email: normalizedEmail }); return { success: true }; } catch (error) { console.error("Assign internship error:", error); return { success: false, message: "An unexpected error occurred. Please try again." }; } }
export async function getInternshipAssignments(): Promise<InternshipAssignmentRow[]> { await guardAdmin(); try { const { data, error } = await supabaseAdmin.from("internship_assignments").select("id, user_email, internship_id, assigned_at, internships(company, role)").order("assigned_at", { ascending: false }); if (error) throw error; return ((data ?? []) as unknown as InternshipAssignmentRow[]).map((row) => ({ ...row, internship: Array.isArray(row.internship) ? row.internship[0] ?? null : row.internship })); } catch (error) { console.error("Get internship assignments error:", error); return []; } }
