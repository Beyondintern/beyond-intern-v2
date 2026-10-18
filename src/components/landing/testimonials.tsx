"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { trackSpotlight } from "@/lib/interactions";

// ── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  name: string;
  designation: string;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
}

// ── Fallback data (shown while Supabase loads or returns no results) ──────────

const fallbackReviews: Review[] = [
  {
    id: "fallback-1",
    name: "Charlotte Williams",
    designation: "Junior Developer at Barclays",
    rating: 5,
    review_text:
      "Beyond Intern completely transformed my understanding of full-stack development. The hands-on projects were incredibly practical and the mentorship quality is unmatched. Landed my first dev role within 2 months!",
    is_approved: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    name: "Rajesh Patel",
    designation: "Data Analyst at Deloitte",
    rating: 5,
    review_text:
      "The Data Science course is genuinely world-class. Professor Williams explains complex ML concepts in such an accessible way. The community support and career resources made all the difference.",
    is_approved: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    name: "Emma Thompson",
    designation: "UX Designer at Revolut",
    rating: 5,
    review_text:
      "As someone transitioning from graphic design to UX, this platform was a godsend. The design course by Lisa Nakamura is pure gold. My portfolio went from basic to interview-ready in just 6 weeks.",
    is_approved: true,
    created_at: new Date().toISOString(),
  },
];

// ── Star rating selector ─────────────────────────────────────────────────────

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Star rating selector">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? "fill-gold text-gold"
                : "text-slate-600 fill-transparent"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────────────────────

const TRUNCATE_LENGTH = 150;

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const safeText = review.review_text || "An amazing learning experience!";
  const safeName = review.name || "Beyond Intern Student";
  const safeDesignation = review.designation || "Student";
  const safeRating = typeof review.rating === "number" ? review.rating : 5;

  const isLong = safeText.length > TRUNCATE_LENGTH;
  const displayText =
    isLong && !expanded ? `${safeText.slice(0, TRUNCATE_LENGTH)}…` : safeText;

  // Generate deterministic avatar initials colour from name
  const initials = safeName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarColors = [
    "from-blue-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-violet-500 to-indigo-600",
    "from-cyan-500 to-blue-600",
  ];
  const colorIndex =
    safeName.charCodeAt(0) % avatarColors.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onPointerMove={trackSpotlight}
      className="glass-card spotlight-card rounded-2xl p-6 group hover:border-electric/20 transition-all flex flex-col"
    >
      {/* Decorative quote icon */}
      <Quote className="h-8 w-8 text-electric/20 mb-3 shrink-0" />

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < safeRating ? "fill-gold text-gold" : "text-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Review text with truncation */}
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-slate-300">
          &ldquo;{displayText}&rdquo;
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-1.5 text-xs font-semibold text-electric hover:text-electric-light transition-colors"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>

      {/* Author */}
      <div className="mt-5 flex items-center gap-3 pt-4 border-t border-white/5">
        {/* Avatar: initials fallback */}
        <div
          className={`h-10 w-10 rounded-full bg-linear-to-br ${avatarColors[colorIndex]} flex items-center justify-center shrink-0`}
          aria-hidden="true"
        >
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{safeName}</p>
          <p className="text-xs text-slate-500 truncate">{safeDesignation}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function ReviewSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-3" aria-hidden="true">
      <div className="h-8 w-8 rounded-full skeleton-shimmer" />
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-4 rounded skeleton-shimmer" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 rounded skeleton-shimmer w-full" />
        <div className="h-3 rounded skeleton-shimmer w-5/6" />
        <div className="h-3 rounded skeleton-shimmer w-4/6" />
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <div className="h-10 w-10 rounded-full skeleton-shimmer" />
        <div className="space-y-1.5">
          <div className="h-3 rounded skeleton-shimmer w-24" />
          <div className="h-2.5 rounded skeleton-shimmer w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  designation: string;
  review: string;
  rating: number;
}

const INITIAL_FORM: FormState = {
  name: "",
  designation: "",
  review: "",
  rating: 5,
};

export function Testimonials() {
  const { toast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch approved reviews ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchReviews() {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, name, designation, rating, review_text, is_approved, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setReviews(data as Review[]);
        }
        // On error: fall back to the curated reviews below rather than
        // hanging on the skeleton.
      } catch {
        // Client init throw (missing env) — same fallback path.
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // ── Derived display data ────────────────────────────────────────────────
  const displayReviews =
    reviews.length > 0 ? reviews : fallbackReviews;
  const visibleReviews = showAll ? displayReviews : displayReviews.slice(0, 3);

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      name: formData.name.trim(),
      designation: formData.designation.trim(),
      review_text: formData.review.trim(),
      rating: formData.rating,
      is_approved: false, // Pending admin approval
    });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "🎉 Review submitted!",
      description:
        "Thanks for sharing your experience. Your review will appear once approved.",
    });
    setFormData(INITIAL_FORM);
  };

  return (
    <section id="reviews" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 gradient-bg" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge className="bg-gold/10 text-gold-light border-gold/20 mb-4">
            Reviews
          </Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="mt-3 text-lg text-slate-400 max-w-xl mx-auto">
            Real stories from real professionals who levelled up with Beyond Intern.
          </p>
        </motion.div>

        {/* Review grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)
          ) : (
            <AnimatePresence>
              {visibleReviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Show more/less toggle */}
        {!isLoading && displayReviews.length > 3 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-full px-6"
            >
              {showAll ? (
                <>
                  Show Less <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Show All Reviews <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Review form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 max-w-xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2 text-center">
              Share Your Experience
            </h3>
            <p className="text-sm text-slate-400 mb-6 text-center">
              Were a Beyond Intern student? We&apos;d love to hear from you!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <Input
                id="review-name"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-electric/50 h-11"
              />

              {/* Designation */}
              <Input
                id="review-designation"
                placeholder="Your designation / position (e.g. Student, Marketing Executive)"
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-electric/50 h-11"
              />

              {/* Star rating */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Your rating *</p>
                <StarSelector
                  value={formData.rating}
                  onChange={(v) => setFormData({ ...formData, rating: v })}
                />
              </div>

              {/* Review text */}
              <textarea
                id="review-text"
                placeholder="Tell us about your experience..."
                value={formData.review}
                onChange={(e) =>
                  setFormData({ ...formData, review: e.target.value })
                }
                required
                rows={4}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-electric/50 focus:outline-none focus:ring-1 focus:ring-electric/30 resize-none"
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gradient-electric text-white font-semibold rounded-full h-11 glow-blue hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? "Submitting…" : "Submit Review"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
