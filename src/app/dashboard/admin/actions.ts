"use server";

import crypto from "node:crypto";
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

export type ListingType = "Job Placement" | "Internship";

export interface InternshipRow {
  id: string;
  company: string;
  role: string;
  listing_type: ListingType;
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
  listing_type: ListingType;
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
    listing_type: data.listing_type === "Internship" ? "Internship" : "Job Placement",
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

// Cached at module scope: whether the internships table has the listing_type
// column yet (added by the internships.sql migration). When it doesn't, we
// omit the field so inserts still succeed on the older schema.
let listingTypeSupported: boolean | null = null;

async function probeListingTypeColumn(): Promise<boolean> {
  if (listingTypeSupported !== null) return listingTypeSupported;
  try {
    const { error } = await supabaseAdmin.from("internships").select("listing_type").limit(1);
    listingTypeSupported = !error;
  } catch {
    listingTypeSupported = false;
  }
  return listingTypeSupported;
}

export async function upsertInternship(data: InternshipInput) {
  await guardAdmin();
  try {
    const parsed = parseInternshipInput(data);
    if (!parsed.company || !parsed.role) return { success: false, message: "Company and role are required." };
    if (!(await probeListingTypeColumn())) {
      delete (parsed as Record<string, unknown>).listing_type;
    }
    const { error } = data.id
      ? await supabaseAdmin.from("internships").update(parsed).eq("id", data.id)
      : await supabaseAdmin.from("internships").insert(parsed);
    if (error) {
      console.error("Upsert internship error:", error);
      return { success: false, message: error.message ?? "Failed to save internship." };
    }
    return { success: true };
  } catch (error) {
    console.error("Upsert internship exception:", error);
    return { success: false, message: error instanceof Error ? error.message : "Failed to save internship." };
  }
}

export async function deleteInternship(id: string) { await guardAdmin(); try { const { error } = await supabaseAdmin.from("internships").delete().eq("id", id); if (error) throw error; return { success: true }; } catch (error) { console.error("Delete internship error:", error); return { success: false, message: "Failed to delete internship." }; } }

// Seed data for the two launch listings — used to populate the DB when empty
// so the public section and the admin dropdown always have live rows.
const SEED_INTERNSHIPS: Array<Omit<InternshipRow, "id" | "created_at">> = [
  {
    company: "Amazon UK Services Ltd.",
    role: "Warehouse Operative / Fulfilment Associate",
    listing_type: "Job Placement",
    location: "United Kingdom",
    employment_type: "Part-Time / Full-Time",
    pay_rate: "£15.10 - £16.10 per hour",
    experience: "No previous experience required for some vacancies",
    shift: "Day / Night shifts, subject to availability",
    description: "Amazon is looking for reliable and motivated individuals to support its UK warehouse and fulfilment operations. Employees help ensure that customer orders are received, processed, packed, sorted and dispatched safely and efficiently.",
    responsibilities: ["Receive, scan and sort incoming products", "Pick, pack and prepare customer orders for dispatch", "Load, unload and move packages safely", "Maintain workplace cleanliness and follow health and safety procedures", "Meet quality and productivity standards", "Work collaboratively with colleagues to meet daily operational targets"],
    requirements: ["Must meet the applicable UK right-to-work requirements", "Ability to follow instructions and safety procedures", "Comfortable standing, walking and handling packages during shifts", "Good teamwork and time-management skills"],
    benefits: ["Competitive hourly pay", "Training provided for eligible entry-level positions", "Potential access to employee benefits, pension and career-development programmes", "Opportunities to explore different operational roles"],
    service_fee: "From £300 (application support service)",
    is_active: true,
  },
  {
    company: "Tesco Stores Ltd.",
    role: "Store Colleague / Customer Assistant",
    listing_type: "Job Placement",
    location: "United Kingdom",
    employment_type: "Part-Time / Full-Time, subject to vacancy",
    pay_rate: "From £13.28 per hour (£14.55 within the M25)",
    experience: "Entry-level opportunities available",
    shift: "Morning / Afternoon / Evening / Twilight, subject to availability",
    description: "Tesco is looking for friendly, reliable and customer-focused individuals to support its UK stores. The role involves helping customers, replenishing shelves, handling products and supporting daily store operations.",
    responsibilities: ["Provide friendly and helpful customer service", "Replenish shelves and maintain product displays", "Assist customers with product enquiries", "Operate checkout facilities when required and trained", "Pick and prepare online customer orders", "Maintain cleanliness and follow health and safety procedures"],
    requirements: ["Must meet UK right-to-work requirements", "Good communication and teamwork skills", "A positive and customer-focused attitude", "Willingness to work flexible shifts, including weekends where required"],
    benefits: ["Competitive hourly pay", "Staff discount through the Tesco Clubcard scheme, subject to eligibility", "Holiday entitlement and pension benefits, subject to applicable terms", "Training and opportunities for career development"],
    service_fee: "From £250 (application support service)",
    is_active: true,
  },
];

export async function seedInternshipsIfEmpty(): Promise<{ success: boolean; seeded?: boolean; message?: string }> {
  await guardAdmin();
  try {
    const { count, error } = await supabaseAdmin
      .from("internships")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    if ((count ?? 0) > 0) return { success: true, seeded: false, message: "Listings already exist." };
    // Omit listing_type if the migration column isn't present yet.
    const rows = (await probeListingTypeColumn())
      ? SEED_INTERNSHIPS
      : SEED_INTERNSHIPS.map((row) => {
          const rest = { ...row } as Record<string, unknown>;
          delete rest.listing_type;
          return rest;
        });
    const { error: insertError } = await supabaseAdmin.from("internships").insert(rows);
    if (insertError) throw insertError;
    return { success: true, seeded: true, message: "Seeded the two launch listings." };
  } catch (error) {
    console.error("Seed internships error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Seeding failed." };
  }
}

export interface InternshipsResult {
  rows: InternshipRow[];
  error: string | null;
}

export async function fetchInternships(): Promise<InternshipRow[]> {
  try {
    // Read only — seeding is a separate explicit admin action. A plain
    // select keeps behaviour identical to the working admin tabs.
    const { data, error } = await supabaseAdmin.from("internships").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    // Normalize listing_type so the card badge never sees undefined on the
    // pre-migration schema.
    return ((data ?? []) as InternshipRow[]).map((row) => ({
      ...row,
      listing_type: row.listing_type ?? "Job Placement",
    }));
  } catch (error) {
    console.error("Fetch internships error:", error);
    return [];
  }
}

// ── Receipt + assignment plumbing ──────────────────────────────────────────

function generateReceiptNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) code += alphabet[bytes[i] % alphabet.length];
  const year = new Date().getFullYear();
  return `BI-RCPT-${year}-${code}`;
}

function feeAmount(serviceFee: string | null): string {
  if (!serviceFee) return "as agreed";
  const match = serviceFee.match(/£\s?\d[\d,]*/);
  return match ? match[0].replace(/\s+/, "") : serviceFee;
}

async function sendReceiptEmail(opts: {
  email: string;
  company: string;
  role: string;
  listingType: string;
  payRate: string | null;
  receiptNumber: string;
  amountPaid: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const { Resend } = await import("resend");
    const { placementReceiptHtml } = await import("@/lib/placement-email");
    const resend = new Resend(apiKey);
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const dashboardUrl = "https://www.beyondintern.com/dashboard/internships";
    await resend.emails.send({
      from: "Beyond Intern <info@beyondintern.com>",
      to: opts.email,
      subject: `Payment & Enrolment Confirmed: ${opts.company} — ${opts.role} (Receipt #${opts.receiptNumber})`,
      html: placementReceiptHtml({
        studentEmail: opts.email,
        company: opts.company,
        role: opts.role,
        listingType: opts.listingType,
        payRate: opts.payRate,
        receiptNumber: opts.receiptNumber,
        amountPaid: opts.amountPaid,
        date,
        dashboardUrl,
      }),
    });
    return { sent: true };
  } catch (error) {
    console.error("[placement] Resend error:", error);
    return { sent: false, error: error instanceof Error ? error.message : "email failed" };
  }
}

export interface InternshipAssignmentRow {
  id: string;
  user_email: string;
  internship_id: string;
  assigned_at: string;
  status: string;
  receipt_number: string | null;
  amount_paid: string | null;
  cv_url: string | null;
  cv_file_name: string | null;
  cv_submitted_at: string | null;
  candidate_notes: string | null;
  admin_notes: string | null;
  internship: { company: string; role: string; listing_type: string; pay_rate: string | null; service_fee: string | null } | null;
}

export async function assignInternship(email: string, internshipId: string, amountOverride?: string) {
  await guardAdmin();
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: internshipRows, error: lookupError } = await supabaseAdmin
      .from("internships")
      .select("company, role, listing_type, pay_rate, service_fee")
      .eq("id", internshipId)
      .limit(1);
    if (lookupError) throw lookupError;
    const internship = internshipRows?.[0];
    if (!internship) return { success: false, message: "Internship not found." };

    const amountPaid = (amountOverride ?? "").trim() || feeAmount(internship.service_fee);
    let receiptNumber = generateReceiptNumber();

    // Retry once on the (astronomically unlikely) unique-collision.
    let insertError = null as { code?: string; message?: string } | null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await supabaseAdmin.from("internship_assignments").insert({
        user_email: normalizedEmail,
        internship_id: internshipId,
        receipt_number: receiptNumber,
        amount_paid: amountPaid,
        status: "assigned",
      });
      if (!error) { insertError = null; break; }
      if (error.code === "23505") {
        if ((error.message ?? "").includes("receipt_number")) { receiptNumber = generateReceiptNumber(); continue; }
        return { success: false, message: "This user is already assigned to that internship." };
      }
      insertError = error;
      break;
    }
    if (insertError) throw insertError;

    // In-app notification
    await supabaseAdmin.from("notifications").insert({
      title: "Placement Confirmed",
      message: `You have been assigned to the ${internship.role} placement at ${internship.company}. Upload your CV on your dashboard to begin.`,
      type: "direct",
      target_email: normalizedEmail,
    });

    // Transactional receipt email (non-blocking on failure)
    const emailResult = await sendReceiptEmail({
      email: normalizedEmail,
      company: internship.company,
      role: internship.role,
      listingType: internship.listing_type ?? "Job Placement",
      payRate: internship.pay_rate,
      receiptNumber,
      amountPaid,
    });
    if (emailResult.sent) {
      await supabaseAdmin
        .from("internship_assignments")
        .update({ receipt_sent_at: new Date().toISOString() })
        .eq("user_email", normalizedEmail)
        .eq("internship_id", internshipId);
    }

    return {
      success: true,
      message: emailResult.sent
        ? "Assigned and receipt emailed."
        : `Assigned. Receipt email not sent (${emailResult.error}).`,
      receiptNumber,
      emailSent: emailResult.sent,
    };
  } catch (error) {
    console.error("Assign internship error:", error);
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}

export async function getInternshipAssignments(): Promise<InternshipAssignmentRow[]> {
  await guardAdmin();
  try {
    const { data, error } = await supabaseAdmin
      .from("internship_assignments")
      .select("id, user_email, internship_id, assigned_at, status, receipt_number, amount_paid, cv_url, cv_file_name, cv_submitted_at, candidate_notes, admin_notes, internships(company, role, listing_type, pay_rate, service_fee)")
      .order("assigned_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as InternshipAssignmentRow[]).map((row) => ({
      ...row,
      internship: Array.isArray(row.internship) ? row.internship[0] ?? null : row.internship,
    }));
  } catch (error) {
    console.error("Get internship assignments error:", error);
    return [];
  }
}

export async function resendPlacementReceipt(assignmentId: string) {
  await guardAdmin();
  try {
    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from("internship_assignments")
      .select("user_email, receipt_number, amount_paid, internships(company, role, listing_type, pay_rate)")
      .eq("id", assignmentId)
      .limit(1);
    if (fetchErr) throw fetchErr;
    const row = rows?.[0];
    if (!row) return { success: false, message: "Assignment not found." };
    const internship = Array.isArray(row.internships) ? row.internships[0] : row.internships;
    if (!internship) return { success: false, message: "Placement not found." };

    const emailResult = await sendReceiptEmail({
      email: row.user_email,
      company: internship.company,
      role: internship.role,
      listingType: internship.listing_type ?? "Job Placement",
      payRate: internship.pay_rate,
      receiptNumber: row.receipt_number ?? generateReceiptNumber(),
      amountPaid: row.amount_paid ?? "as agreed",
    });
    if (!emailResult.sent) return { success: false, message: `Email failed (${emailResult.error}).` };
    await supabaseAdmin
      .from("internship_assignments")
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq("id", assignmentId);
    return { success: true, message: "Receipt re-sent." };
  } catch (error) {
    console.error("Resend receipt error:", error);
    return { success: false, message: "Failed to resend receipt." };
  }
}

const PLACEMENT_STATUSES = ["assigned", "cv_submitted", "under_review", "employer_stage"] as const;

export async function updateAssignmentStatus(assignmentId: string, status: string) {
  await guardAdmin();
  if (!(PLACEMENT_STATUSES as readonly string[]).includes(status)) {
    return { success: false, message: "Invalid status." };
  }
  try {
    const { data: statusRows, error: statusFetchErr } = await supabaseAdmin
      .from("internship_assignments")
      .select("user_email, internships(role, company)")
      .eq("id", assignmentId)
      .limit(1);
    if (statusFetchErr) throw statusFetchErr;
    const row = statusRows?.[0];
    const { error } = await supabaseAdmin
      .from("internship_assignments")
      .update({ status })
      .eq("id", assignmentId);
    if (error) throw error;

    if (row) {
      const internship = Array.isArray(row.internships) ? row.internships[0] : row.internships;
      const label = status.replace(/_/g, " ");
      await supabaseAdmin.from("notifications").insert({
        title: "Placement update",
        message: `Your ${internship ? `${internship.role} placement at ${internship.company}` : "placement"} is now: ${label}.`,
        type: "direct",
        target_email: row.user_email,
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Update assignment status error:", error);
    return { success: false, message: "Failed to update status." };
  }
}

export async function saveAdminNotes(assignmentId: string, adminNotes: string) {
  await guardAdmin();
  try {
    const { data: noteRows, error: noteFetchErr } = await supabaseAdmin
      .from("internship_assignments")
      .select("user_email")
      .eq("id", assignmentId)
      .limit(1);
    if (noteFetchErr) throw noteFetchErr;
    const row = noteRows?.[0];
    const { error } = await supabaseAdmin
      .from("internship_assignments")
      .update({ admin_notes: adminNotes.trim() || null })
      .eq("id", assignmentId);
    if (error) throw error;
    if (row && adminNotes.trim()) {
      await supabaseAdmin.from("notifications").insert({
        title: "Message from the placement team",
        message: adminNotes.trim(),
        type: "direct",
        target_email: row.user_email,
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Save admin notes error:", error);
    return { success: false, message: "Failed to save notes." };
  }
}
