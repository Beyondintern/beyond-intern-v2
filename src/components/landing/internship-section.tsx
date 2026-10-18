"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Banknote,
  Clock3,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trackSpotlight } from "@/lib/interactions";
import { fetchInternships } from "@/app/dashboard/admin/actions";
import type { InternshipRow } from "@/app/dashboard/admin/actions";

/* ── Seed listings (fallback when the DB has none yet) ─────────────────── */

const FALLBACK_INTERNSHIPS: InternshipRow[] = [
  {
    id: "seed-amazon-uk",
    company: "Amazon UK Services Ltd.",
    role: "Warehouse Operative / Fulfilment Associate",
    location: "United Kingdom",
    employment_type: "Part-Time / Full-Time",
    pay_rate: "£15.10 - £16.10 per hour",
    experience: "No previous experience required for some vacancies",
    shift: "Day / Night shifts, subject to availability",
    description:
      "Amazon is looking for reliable and motivated individuals to support its UK warehouse and fulfilment operations. Employees help ensure that customer orders are received, processed, packed, sorted and dispatched safely and efficiently.",
    responsibilities: [
      "Receive, scan and sort incoming products",
      "Pick, pack and prepare customer orders for dispatch",
      "Load, unload and move packages safely",
      "Maintain workplace cleanliness and follow health and safety procedures",
      "Meet quality and productivity standards",
      "Work collaboratively with colleagues to meet daily operational targets",
    ],
    requirements: [
      "Must meet the applicable UK right-to-work requirements",
      "Ability to follow instructions and safety procedures",
      "Comfortable standing, walking and handling packages during shifts",
      "Good teamwork and time-management skills",
    ],
    benefits: [
      "Competitive hourly pay",
      "Training provided for eligible entry-level positions",
      "Potential access to employee benefits, pension and career-development programmes",
      "Opportunities to explore different operational roles",
    ],
    service_fee: "From £300 (application support service)",
    is_active: true,
    created_at: "",
  },
  {
    id: "seed-tesco-uk",
    company: "Tesco Stores Ltd.",
    role: "Store Colleague / Customer Assistant",
    location: "United Kingdom",
    employment_type: "Part-Time / Full-Time, subject to vacancy",
    pay_rate: "From £13.28 per hour (£14.55 within the M25)",
    experience: "Entry-level opportunities available",
    shift: "Morning / Afternoon / Evening / Twilight, subject to availability",
    description:
      "Tesco is looking for friendly, reliable and customer-focused individuals to support its UK stores. The role involves helping customers, replenishing shelves, handling products and supporting daily store operations.",
    responsibilities: [
      "Provide friendly and helpful customer service",
      "Replenish shelves and maintain product displays",
      "Assist customers with product enquiries",
      "Operate checkout facilities when required and trained",
      "Pick and prepare online customer orders",
      "Maintain cleanliness and follow health and safety procedures",
    ],
    requirements: [
      "Must meet UK right-to-work requirements",
      "Good communication and teamwork skills",
      "A positive and customer-focused attitude",
      "Willingness to work flexible shifts, including weekends where required",
    ],
    benefits: [
      "Competitive hourly pay",
      "Staff discount through the Tesco Clubcard scheme, subject to eligibility",
      "Holiday entitlement and pension benefits, subject to applicable terms",
      "Training and opportunities for career development",
    ],
    service_fee: "From £250 (application support service)",
    is_active: true,
    created_at: "",
  },
];

/* ── Detail card: expandable facts, lists, disclaimer ───────────────────── */

function InternshipCard({ internship, index }: { internship: InternshipRow; index: number }) {
  const [open, setOpen] = useState(false);

  const facts = [
    { icon: MapPin, label: internship.location },
    { icon: Clock3, label: internship.employment_type },
    { icon: Banknote, label: internship.pay_rate },
    { icon: Sparkles, label: internship.experience },
  ].filter((fact) => Boolean(fact.label));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Double-bezel: outer shell + inner core with concentric radii */}
      <div
        onPointerMove={trackSpotlight}
        className="glass-card spotlight-card rounded-[1.75rem] overflow-hidden group"
      >
        {/* Company monogram header band */}
        <div className="relative h-20 bg-linear-to-r from-electric/25 via-navy-light to-gold/15 flex items-center px-7 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(96,165,250,0.18),transparent_60%)]" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-11 w-11 rounded-full glass-strong flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white tracking-wide">
                {internship.company
                  .split(" ")
                  .map((w) => w[0])
                  .filter((ch) => /[A-Z]/.test(ch))
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.18em] truncate">
                {internship.company}
              </p>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug truncate">
                {internship.role}
              </h3>
            </div>
          </div>
          {internship.is_active && (
            <span className="absolute top-3 right-4 z-10 flex items-center gap-1.5 rounded-full bg-emerald/15 border border-emerald/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
              </span>
              Open
            </span>
          )}
        </div>

        <div className="p-6 sm:p-7">
          {/* Fact chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/8 px-3.5 py-2.5"
              >
                <fact.icon className="h-4 w-4 text-electric-light shrink-0" aria-hidden="true" />
                <span className="text-xs text-slate-300 leading-snug">{fact.label}</span>
              </div>
            ))}
          </div>

          {internship.description && (
            <p className="mt-5 text-sm text-slate-400 leading-relaxed">
              {internship.description}
            </p>
          )}

          {/* Expandable detail */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="mt-5 flex w-full items-center justify-between rounded-xl px-4 py-3 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-electric/25 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-light"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Briefcase className="h-4 w-4 text-electric-light" aria-hidden="true" />
              Role details
            </span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </motion.span>
          </button>

          <motion.div
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-6">
              {[
                { title: "Key Responsibilities", items: internship.responsibilities },
                { title: "Eligibility & Requirements", items: internship.requirements },
                { title: "Benefits", items: internship.benefits },
              ]
                .filter((list) => list.items && list.items.length > 0)
                .map((list) => (
                  <div key={list.title}>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
                      {list.title}
                    </h4>
                    <ul className="space-y-2.5">
                      {list.items!.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald shrink-0 mt-0.5" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

              {internship.shift && (
                <div className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/8 px-3.5 py-3">
                  <Clock3 className="h-4 w-4 text-gold-light shrink-0" aria-hidden="true" />
                  <p className="text-xs text-slate-300">{internship.shift}</p>
                </div>
              )}

              {/* Application-assistance disclosure */}
              <div className="rounded-xl border border-gold/25 bg-gold/8 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-4 w-4 text-gold-light shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gold-light">
                      Paid job application assistance
                    </p>
                    {internship.service_fee && (
                      <p className="text-xs text-slate-300">{internship.service_fee}</p>
                    )}
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      The service fee covers application support only, never payment to the
                      employer for employment. Vacancies, pay and selection vary by location;
                      employment is subject to the employer&apos;s official recruitment process
                      and a valid job offer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA — button-in-button trailing icon */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-[11px] text-slate-500">
              Assigned directly to your dashboard after enrolment.
            </p>
            <a
              href="/contact"
              className="group inline-flex items-center gap-3 rounded-full gradient-electric px-6 py-3 text-sm font-semibold text-white glow-blue transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.97]"
            >
              <span className="whitespace-nowrap">Apply with Support</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

export function InternshipSection() {
  const [internships, setInternships] = useState<InternshipRow[]>(FALLBACK_INTERNSHIPS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchInternships();
        // Only replace the seed listings when live rows exist; otherwise
        // the curated pair above keeps the section presentable.
        const active = data.filter((row) => row.is_active);
        if (active.length > 0) setInternships(active);
      } catch {
        // keep fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section id="internships" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-navy-light/40" aria-hidden="true" />
      <div
        className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-electric/6 blur-[140px]"
        aria-hidden="true"
      />
      <div className="absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-electric/25 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="mb-14 max-w-2xl"
        >
          <Badge className="mb-5 rounded-full border-emerald/25 bg-emerald/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald">
            Placements & Internships
          </Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl leading-tight">
            Real employers.
            <br />
            <span className="gradient-text">Real UK placements.</span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 leading-relaxed max-w-xl">
            We work with recognised UK employers to place our learners into paid roles
            alongside their training, with dedicated application support at every step.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {loading ? (
            <>
              {[0, 1].map((i) => (
                <div key={i} className="glass-card rounded-[1.75rem] overflow-hidden" aria-hidden="true">
                  <div className="skeleton-shimmer h-20" />
                  <div className="p-7 space-y-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="skeleton-shimmer h-11 rounded-xl" />
                      <div className="skeleton-shimmer h-11 rounded-xl" />
                      <div className="skeleton-shimmer h-11 rounded-xl" />
                      <div className="skeleton-shimmer h-11 rounded-xl" />
                    </div>
                    <div className="skeleton-shimmer h-3.5 w-full rounded-full" />
                    <div className="skeleton-shimmer h-3.5 w-4/5 rounded-full" />
                    <div className="skeleton-shimmer h-12 w-full rounded-xl" />
                    <div className="skeleton-shimmer h-12 w-52 rounded-full" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            internships.map((internship, i) => (
              <InternshipCard key={internship.id} internship={internship} index={i} />
            ))
          )}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[1.75rem] glass-card px-7 py-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-full gradient-electric glow-blue flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <p className="text-sm text-slate-300 max-w-md">
              Enrolled students are assigned internships directly on their dashboard by
              our placement team.
            </p>
          </div>
          <a
            href="/login"
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/8 hover:border-white/25 active:scale-[0.97]"
          >
            Go to Dashboard
            <ArrowUpRight className="h-4 w-4 text-electric-light transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
