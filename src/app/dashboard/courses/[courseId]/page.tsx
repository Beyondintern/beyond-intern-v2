import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import { CourseVideoClient } from "./CourseVideoClient";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

// Server-side Supabase client (anon key is fine for public course data)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;

  if (!supabase) return { title: "Course unavailable", description: "Course data is temporarily unavailable." };

  const { data: course } = await supabase
    .from("raw_courses")
    .select("id, title, description, image_url, category, level")
    .eq("id", courseId)
    .single();

  if (!course) {
    return {
      title: "Course Not Found",
      description: "This course could not be found on Beyond Intern.",
    };
  }

  const title = `${course.title} | Beyond Intern`;
  const description =
    course.description ||
    `Enroll in ${course.title} on Beyond Intern — a ${course.level ?? ""} ${course.category ?? ""} course with placement support and lifetime access.`;

  const courseUrl = `https://www.beyondintern.com/dashboard/courses/${course.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: courseUrl,
    },
    openGraph: {
      type: "article",
      url: courseUrl,
      title,
      description,
      siteName: "Beyond Intern",
      images: course.image_url
        ? [{ url: course.image_url, width: 1200, height: 630, alt: `${course.title} course cover image on Beyond Intern` }]
        : [{ url: "/og-default.png", width: 1200, height: 630, alt: "Beyond Intern — Premium EdTech Platform" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: course.image_url ? [course.image_url] : ["/og-default.png"],
    },
  };
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkEnrollment } from "../actions";

export default async function CourseVideoPage({ params }: PageProps) {
  const { courseId } = await params;

  if (!supabase) return null;

  const { data: course } = await supabase
    .from("raw_courses")
    .select("id, title, description, price, curriculum, career_outcomes, schedule, category, level, duration, video_modules, curriculum_syllabus, schedule_text, assignment_link")
    .eq("id", courseId)
    .single();

  if (course) {
    course.curriculum = Array.isArray(course.curriculum) ? course.curriculum : [];
  }

  const session = await getServerSession(authOptions);
  let isEnrolled = false;
  if (session?.user?.email) {
    isEnrolled = await checkEnrollment(courseId);
  }

  // Complimentary courses (price null/empty) use price 0 rather than
  // an accidental "0" default for paid courses missing a parseable price.
  let numericPrice: string | null = null;
  if (course?.price) {
    const stripped = String(course.price).replace(/[^\d.]/g, '');
    if (stripped) {
      numericPrice = stripped;
    }
  }

  const jsonLd = course ? {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description || "",
    provider: {
      "@type": "Organization",
      name: "Beyond Intern",
      url: "https://www.beyondintern.com"
    },
    offers: {
      "@type": "Offer",
      price: numericPrice ?? "0",
      priceCurrency: "GBP"
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CourseVideoClient initialCourse={course ?? undefined} serverIsEnrolled={isEnrolled} />
    </>
  );
}