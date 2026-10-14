"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowRight, BookOpen, Filter, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { trackSpotlight } from "@/lib/interactions";

// ── DB course shape ────────────────────────────────────────────────────────────
interface DbCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: string;
  outcomes: string;
  price?: string | null;
  image_url?: string | null;
  curriculum?: string | null;
  created_at?: string;
}

// ── Category config ────────────────────────────────────────────────────────────
const categoryConfig: Record<
  string,
  { icon: string; gradient: string; color: string; fallbackImage: string }
> = {
  "Technical Skills": {
    icon: "💻",
    gradient: "from-blue-600/30 to-cyan-500/20",
    color: "text-blue-400",
    fallbackImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
  },
  "Analytical Skills": {
    icon: "📊",
    gradient: "from-emerald-600/30 to-teal-500/20",
    color: "text-emerald-400",
    fallbackImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  },
  "Marketing & Sales": {
    icon: "📢",
    gradient: "from-orange-600/30 to-amber-500/20",
    color: "text-amber-400",
    fallbackImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  },
  "Professional & Soft Skills": {
    icon: "🧠",
    gradient: "from-purple-600/30 to-pink-500/20",
    color: "text-purple-400",
    fallbackImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
  },
  "Finance & Investment": {
    icon: "📈",
    gradient: "from-green-600/30 to-emerald-500/20",
    color: "text-green-400",
    fallbackImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  },
  "Creative Skills": {
    icon: "🎨",
    gradient: "from-rose-600/30 to-fuchsia-500/20",
    color: "text-rose-400",
    fallbackImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  },
  "Career Readiness": {
    icon: "🚀",
    gradient: "from-indigo-600/30 to-violet-500/20",
    color: "text-indigo-400",
    fallbackImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
  },
};

const ALL_CATEGORIES = [
  "All",
  "Technical Skills",
  "Analytical Skills",
  "Marketing & Sales",
  "Professional & Soft Skills",
  "Finance & Investment",
  "Creative Skills",
  "Career Readiness",
] as const;

// ── Card ───────────────────────────────────────────────────────────────────────
function CourseCard({ course, index }: { course: DbCourse; index: number }) {
  const config = categoryConfig[course.category] ?? categoryConfig["Technical Skills"];
  const outcomesList = course.outcomes ? course.outcomes.split("\n").filter(Boolean) : [];
  // Price arrives as a raw string like "£650" from the DB; keep it verbatim
  // (already currency-formatted) and only fall back for empty/null.
  const isComplimentary = !course.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.08 }}
      whileHover={{ y: -6 }}
      onPointerMove={trackSpotlight}
      className="group glass-card spotlight-card rounded-2xl overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(3,7,20,0.55)]"
    >
      {/* Thumbnail */}
      <div
        className={`relative h-44 bg-linear-to-br ${config.gradient} flex items-center justify-center overflow-hidden`}
      >
        {course.image_url ? (
          <Image
            src={course.image_url}
            alt={`${course.title} — ${course.category} course cover graphic on Beyond Intern`}
            fill
            unoptimized={true}
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <>
            <Image
              src={config.fallbackImage}
              alt={`${course.title} — ${course.category} course illustration`}
              fill
              className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-navy/50" />
            <span className="relative z-10 text-5xl opacity-30">
              {config.icon}
            </span>
          </>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-white/10 text-white border-white/20 text-xs backdrop-blur-sm">
            {course.category}
          </Badge>
        </div>

        {/* Duration chip — bottom-left over the image, away from the badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Clock className="h-3 w-3 text-electric-light" aria-hidden="true" />
            {course.duration}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Level */}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {course.level}
        </span>

        <h3 className="mt-2 text-base font-semibold text-white line-clamp-2 leading-snug group-hover:text-electric-light transition-colors">
          {course.title}
        </h3>

        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Stats row — level only; duration moved onto the image chip */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {course.level}
          </span>
        </div>

        {/* Career outcomes */}
        <div className="mt-3 flex flex-wrap gap-1">
          {outcomesList.slice(0, 2).map((outcome) => (
            <span
              key={outcome}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/8"
            >
              {outcome}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800">
          {isComplimentary ? (
            <span className="flex items-center gap-1.5 text-xl font-bold text-emerald">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-semibold tracking-wide">Free</span>
            </span>
          ) : (
            <span className="text-xl font-bold text-white">
              {course.price}
            </span>
          )}
          <Link href={`/checkout?course=${encodeURIComponent(course.id)}`}>
            <Button
              size="sm"
              className="gradient-electric text-white rounded-full px-5 text-xs font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
            >
              View Course
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Section ───────────────────────────────────────────────────────────────
export function CourseGrid() {
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("raw_courses")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          setLoadError(true);
        } else if (data) {
          setCourses(data);
        }
      } catch {
        // Client init throw (missing env) or network failure — surface the
        // error state instead of hanging on the skeleton forever.
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    activeFilter === "All"
      ? courses
      : courses.filter((c) => c.category === activeFilter);

  const isFiltered = activeFilter !== "All";
  const visibleCourses = isFiltered || showAll ? filtered : filtered.slice(0, 6);
  const hasMore = !isFiltered && !showAll && filtered.length > 6;

  return (
    <section id="courses" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 gradient-bg" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gold/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl mb-4">
            Learn from the <span className="gradient-text">Best in Industry</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            {courses.length || 30}+ industry-aligned courses across 7 skill tracks. Every programme includes lifetime access and a certificate of completion.
          </p>
        </motion.div>

        {/* Category filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 flex flex-wrap items-center justify-center gap-2"
        >
          <Filter className="h-4 w-4 text-slate-500 mr-1 shrink-0" />
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={activeFilter === cat}
              onClick={() => {
                setActiveFilter(cat);
                setShowAll(false);
              }}
              className={`text-xs font-medium px-4 py-1.5 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-light ${
                activeFilter === cat
                  ? "gradient-electric text-white border-transparent glow-blue"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20 bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Loading state */}
        {loading ? (
          <div aria-busy="true" aria-label="Loading courses" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <div className="skeleton-shimmer h-44" />
                <div className="p-5 space-y-3">
                  <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
                  <div className="skeleton-shimmer h-4 w-5/6 rounded-full" />
                  <div className="skeleton-shimmer h-3 w-2/3 rounded-full" />
                  <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="skeleton-shimmer h-5 w-16 rounded-full" />
                    <div className="skeleton-shimmer h-8 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="py-20 text-center">
            <p className="text-slate-300">Courses are temporarily unavailable.</p>
            <p className="mt-2 text-sm text-slate-500">Please try again in a moment.</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400">No courses available yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>

            {/* View All button */}
            <AnimatePresence>
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-10 flex justify-center"
                >
                  <Button
                    onClick={() => setShowAll(true)}
                    variant="outline"
                    className="rounded-full px-8 py-3 border-white/15 text-white hover:bg-white/5 hover:border-white/25 text-sm font-semibold gap-2 transition-all"
                  >
                    View All {filtered.length} Courses
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <p className="text-slate-400 text-sm mb-4">
            All programs include Career Readiness support & placement assistance.
          </p>
          <Link href="/login">
            <Button className="gradient-electric text-white rounded-full px-8 py-3 font-semibold glow-blue hover:opacity-90 transition-opacity">
              Start Your Journey Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
