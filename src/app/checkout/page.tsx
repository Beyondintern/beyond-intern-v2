"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { courseData as allCourses } from "@/lib/courses";

const gradientMap: Record<string, string> = {
  "Technical Skills": "from-blue-600/30 to-cyan-500/20",
  "Analytical Skills": "from-emerald-600/30 to-teal-500/20",
  "Marketing & Sales": "from-orange-600/30 to-amber-500/20",
  "Professional & Soft Skills": "from-purple-600/30 to-pink-500/20",
  "Finance & Investment": "from-green-600/30 to-emerald-500/20",
  "Creative Skills": "from-rose-600/30 to-fuchsia-500/20",
  "Career Readiness": "from-indigo-600/30 to-violet-500/20",
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course") || "";
  const foundCourse = allCourses.find((c) => c.id === courseId);
  const courseTitle = foundCourse?.title ?? "Beyond Intern Course";
  const coursePrice = foundCourse?.price ?? 950;
  const courseCategory = foundCourse?.category ?? "Technical Skills";
  const courseDuration = foundCourse?.duration ?? "12–20 Weeks";
  const courseGradient = gradientMap[courseCategory] ?? "from-blue-600/30 to-cyan-500/20";
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast({
        title: "Checkout failed",
        description: data.error || "Please try again in a moment.",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Checkout failed",
        description: "Network error — please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-28 pb-16 overflow-hidden">
      <div className="absolute inset-0 gradient-bg" />
      <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-electric/8 blur-[120px]" />
      <div className="absolute bottom-1/3 -right-32 h-96 w-96 rounded-full bg-gold/6 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge className="bg-emerald/10 text-emerald border-emerald/20 mb-4">
            <ShieldCheck className="mr-1 h-3 w-3" /> Secure Checkout
          </Badge>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Complete Your Enrolment
          </h1>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Course summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className={`h-48 bg-linear-to-br ${courseGradient} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-navy/30" />
                <span className="relative z-10 text-6xl opacity-40">🎓</span>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white">{courseTitle}</h2>
                <p className="text-sm text-slate-400 mt-1">{courseCategory}</p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {courseDuration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Lifetime Access
                  </span>
                </div>

                <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
                  <h3 className="text-sm font-semibold text-white">What&apos;s included:</h3>
                  {[
                    "Lifetime access to all modules",
                    "Certificate of completion",
                    "Access to private community",
                    "Weekly live Q&A sessions",
                    "Downloadable resources",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-6">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Course</span>
                  <span className="text-white">{courseTitle}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Duration</span>
                  <span>{courseDuration}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-white font-semibold text-lg">
                  <span>Total</span>
                  <span>£{coursePrice}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full mt-6 h-12 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity text-base"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay £{coursePrice} Now
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                Secured by Stripe. 256-bit encryption.
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gold/5 border border-gold/10">
                <p className="text-xs text-gold-light font-medium">
                  💡 30-Day Money-Back Guarantee
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Not satisfied? Get a full refund within 30 days, no questions asked.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-white/30 border-t-electric rounded-full"
        />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
