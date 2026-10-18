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
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trackSpotlight } from "@/lib/interactions";
import { getMyInternships } from "@/app/dashboard/courses/actions";
import type { MyInternship } from "@/app/dashboard/courses/actions";

function assignedDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function AssignedInternshipCard({ internship, index }: { internship: MyInternship; index: number }) {
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
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        onPointerMove={trackSpotlight}
        className="glass-card spotlight-card rounded-[1.75rem] overflow-hidden"
      >
        {/* Company monogram header band */}
        <div className="relative h-20 bg-linear-to-r from-electric/25 via-navy-light to-gold/15 flex items-center px-7 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(96,165,250,0.18),transparent_60%)]" />
          <div className="relative z-10 flex items-center gap-4 min-w-0">
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
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug truncate">
                {internship.role}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge className="rounded-full border-emerald/25 bg-emerald/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald">
              Assigned placement
            </Badge>
            {internship.assigned_at && (
              <span className="text-[11px] text-slate-500">
                Assigned {assignedDate(internship.assigned_at)}
              </span>
            )}
          </div>

          {/* Fact chips */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
                      {list.title}
                    </h3>
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

              {internship.service_fee && (
                <div className="rounded-xl border border-gold/25 bg-gold/8 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-4 w-4 text-gold-light shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gold-light">
                        Paid job application assistance
                      </p>
                      <p className="text-xs text-slate-300">{internship.service_fee}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* CTA */}
          <div className="mt-6 flex justify-end">
            <a
              href="/contact"
              className="group inline-flex items-center gap-3 rounded-full gradient-electric px-6 py-3 text-sm font-semibold text-white glow-blue transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.97]"
            >
              <span className="whitespace-nowrap">Contact Placement Team</span>
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

export default function MyInternshipsPage() {
  const [internships, setInternships] = useState<MyInternship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyInternships();
        if (active) setInternships(data);
      } catch (err) {
        console.error("Failed to fetch internships:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl"
    >
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-electric-light" />
          My Internships
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Placements assigned to you by the Beyond Intern placement team.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading your internships">
          {[0, 1].map((i) => (
            <div key={i} className="glass-card rounded-[1.75rem] overflow-hidden">
              <div className="skeleton-shimmer h-20" />
              <div className="p-7 space-y-4">
                <div className="skeleton-shimmer h-5 w-32 rounded-full" />
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="skeleton-shimmer h-11 rounded-xl" />
                  <div className="skeleton-shimmer h-11 rounded-xl" />
                  <div className="skeleton-shimmer h-11 rounded-xl" />
                  <div className="skeleton-shimmer h-11 rounded-xl" />
                </div>
                <div className="skeleton-shimmer h-3.5 w-full rounded-full" />
                <div className="skeleton-shimmer h-12 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : internships.length === 0 ? (
        <div className="glass-card rounded-[1.75rem] p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-electric/4 via-transparent to-gold/4" />
          <div className="relative">
            <div className="mx-auto mb-5 h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Search className="h-10 w-10 text-slate-500" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-white">No placements assigned yet</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
              Our placement team assigns internships as you progress through your
              programme. Explore current openings on the homepage.
            </p>
            <Link href="/#internships">
              <Button className="mt-6 gradient-electric text-white font-semibold rounded-full px-8 hover:opacity-90 active:scale-[0.98] transition-all">
                Explore Internships
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {internships.map((internship, i) => (
            <AssignedInternshipCard key={`${internship.id}-${internship.assigned_at}`} internship={internship} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
