"use client";

import { useEffect, useRef, useState } from "react";
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
  UploadCloud,
  FileCheck2,
  FileText,
  RotateCw,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trackSpotlight } from "@/lib/interactions";
import {
  getMyInternships,
  uploadPlacementCv,
  getPlacementCvUrl,
} from "@/app/dashboard/courses/actions";
import type { MyInternship } from "@/app/dashboard/courses/actions";

/* ── Pipeline stepper ─────────────────────────────────────────────────────── */

const STEPS = [
  { key: "assigned", label: "Enrolment Confirmed", short: "Enrolment" },
  { key: "cv_submitted", label: "CV Submitted", short: "CV Sent" },
  { key: "under_review", label: "Under Review", short: "Review" },
  { key: "employer_stage", label: "Employer / Interview", short: "Interview" },
];

function stepIndex(status: string) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

function PipelineStepper({ status }: { status: string }) {
  const current = stepIndex(status);
  return (
    <ol className="flex items-center gap-1 sm:gap-2" aria-label="Application progress">
      {STEPS.map((step, i) => {
        const reached = i <= current;
        const isCurrent = i === current;
        return (
          <li key={step.key} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border text-[10px] sm:text-[11px] font-bold transition-all duration-500 shrink-0 ${
                  reached
                    ? "gradient-electric border-transparent text-white glow-blue"
                    : "bg-white/5 border-white/12 text-slate-500"
                } ${isCurrent ? "ring-2 ring-electric/40 ring-offset-2 ring-offset-navy" : ""}`}
              >
                {i < current ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </div>
              <span
                className={`text-[8px] sm:text-[10px] leading-tight text-center transition-colors ${
                  reached ? "text-white font-medium" : "text-slate-600"
                }`}
              >
                <span className="sm:hidden">{step.short}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-0.5 sm:mx-1.5 h-px flex-1 mb-5 transition-colors duration-500 ${
                  i < current ? "bg-electric" : "bg-white/10"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── CV upload / update module ────────────────────────────────────────────── */

function CvModule({
  internship,
  onUpdated,
}: {
  internship: MyInternship;
  onUpdated: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState(internship.candidate_notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const hasCv = Boolean(internship.cv_url);

  async function handleSubmit() {
    if (!file) {
      setMsg({ type: "err", text: "Choose a CV file first (PDF, DOC or DOCX, max 10MB)." });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    const formData = new FormData();
    formData.append("assignment_id", internship.assignment_id);
    formData.append("cv", file);
    formData.append("candidate_notes", notes);
    const result = await uploadPlacementCv(formData);
    setSubmitting(false);
    if (result.success) {
      setMsg({ type: "ok", text: result.message ?? "CV uploaded." });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onUpdated();
    } else {
      setMsg({ type: "err", text: result.message ?? "Upload failed." });
    }
  }

  async function handleViewCv() {
    const { url } = await getPlacementCvUrl(internship.assignment_id);
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg gradient-electric flex items-center justify-center shrink-0">
          <UploadCloud className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Submit / Update Your CV</h3>
          <p className="text-[11px] text-slate-500">PDF, DOC or DOCX - max 10MB</p>
        </div>
        {hasCv && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald/15 border border-emerald/25 px-2.5 py-1 text-[10px] font-semibold text-emerald">
            <FileCheck2 className="h-3 w-3" aria-hidden="true" /> On file
          </span>
        )}
      </div>

      {hasCv && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald/8 border border-emerald/20 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="h-4 w-4 text-emerald shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{internship.cv_file_name}</p>
              {internship.cv_submitted_at && (
                <p className="text-[10px] text-slate-500">
                  Uploaded {new Date(internship.cv_submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleViewCv}
            className="text-xs font-semibold text-emerald hover:text-emerald-light underline underline-offset-2"
          >
            View Current CV
          </button>
        </div>
      )}

      <label
        htmlFor={`cv-input-${internship.assignment_id}`}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 hover:border-electric/40 bg-white/3 hover:bg-electric/5 px-4 py-6 text-center transition-all duration-300"
      >
        <UploadCloud className="h-6 w-6 text-electric-light" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-300">
          {file ? file.name : hasCv ? "Tap to choose an updated CV" : "Tap to choose your CV"}
        </span>
        <span className="text-[10px] text-slate-500">or drag and drop</span>
        <input
          id={`cv-input-${internship.assignment_id}`}
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div>
        <label htmlFor={`cv-notes-${internship.assignment_id}`} className="sr-only">
          Availability, preferred shift or contact note
        </label>
        <textarea
          id={`cv-notes-${internship.assignment_id}`}
          placeholder="Availability / preferred shift / contact note (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-electric/50 focus:outline-none focus:ring-1 focus:ring-electric/30 resize-none"
        />
      </div>

      {msg && (
        <p
          className={`text-xs rounded-lg px-3 py-2 ${
            msg.type === "ok"
              ? "bg-emerald/10 text-emerald border border-emerald/25"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/25"
          }`}
          role="status"
        >
          {msg.text}
        </p>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !file}
        className="w-full h-11 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {submitting ? (
          <RotateCw className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <>
            <UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />
            {hasCv ? "Upload Updated CV" : "Submit My CV"}
          </>
        )}
      </Button>
    </div>
  );
}

/* ── Placement card ───────────────────────────────────────────────────────── */

function PlacementCard({
  internship,
  index,
  onUpdated,
}: {
  internship: MyInternship;
  index: number;
  onUpdated: () => void;
}) {
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
        className="glass-card spotlight-card rounded-[1.75rem] overflow-hidden min-w-0 w-full"
      >
        {/* Header band: monogram, company, role, listing badge, receipt ref */}
        <div className="relative bg-linear-to-r from-electric/25 via-navy-light to-gold/15 px-4 sm:px-7 py-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(96,165,250,0.18),transparent_60%)]" />
          <div className="relative z-10 flex items-start gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full glass-strong flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm font-bold text-white tracking-wide">
                {internship.company
                  .split(" ")
                  .map((w) => w[0])
                  .filter((ch) => /[A-Z]/.test(ch))
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-300 uppercase tracking-[0.14em] sm:tracking-[0.18em]">
                  {internship.company}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    internship.listing_type === "Internship"
                      ? "bg-gold/15 border border-gold/30 text-gold-light"
                      : "bg-electric/15 border border-electric/30 text-electric-light"
                  }`}
                >
                  {internship.listing_type === "Internship" ? "Internship" : "Job Placement"}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-bold text-white leading-snug">
                {internship.role}
              </h2>
              {internship.receipt_number && (
                <p className="mt-1 text-[10px] font-mono text-slate-400">
                  Receipt #{internship.receipt_number}
                  {internship.assigned_at && (
                    <span className="text-slate-600">
                      {"  ·  "}Assigned {new Date(internship.assigned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-7">
          {/* Pipeline stepper */}
          <PipelineStepper status={internship.status} />

          {/* Fact chips */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-center gap-2.5 rounded-xl bg-white/4 border border-white/8 px-3.5 py-2.5 min-w-0"
              >
                <fact.icon className="h-4 w-4 text-electric-light shrink-0" aria-hidden="true" />
                <span className="text-xs text-slate-300 leading-snug">{fact.label}</span>
              </div>
            ))}
          </div>

          {/* Coordinator update callout */}
          {internship.admin_notes && (
            <div className="mt-5 rounded-xl border border-electric/25 bg-linear-to-r from-electric/12 to-gold/8 p-4">
              <div className="flex items-start gap-3">
                <MessageSquareText className="h-4 w-4 text-electric-light shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-electric-light">
                    Update from Placement Team
                  </p>
                  <p className="mt-1.5 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {internship.admin_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CV module — core action */}
          <CvModule internship={internship} onUpdated={onUpdated} />

          {/* Expandable role details */}
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
              {internship.description && (
                <p className="text-sm text-slate-400 leading-relaxed">{internship.description}</p>
              )}
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

              {internship.service_fee && (
                <div className="rounded-xl border border-gold/25 bg-gold/8 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-4 w-4 text-gold-light shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-slate-300">{internship.service_fee}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Footer CTA */}
          <div className="mt-6 flex justify-end max-sm:flex-col">
            <a
              href="/contact"
              className="group inline-flex items-center justify-between sm:justify-start gap-3 rounded-full gradient-electric px-5 sm:px-6 py-3 text-sm font-semibold text-white glow-blue transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90 active:scale-[0.97] w-full sm:w-auto"
            >
              <span className="whitespace-nowrap">Contact Placement Team</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function MyInternshipsPage() {
  const [internships, setInternships] = useState<MyInternship[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await getMyInternships();
      setInternships(data);
    } catch (err) {
      console.error("Failed to fetch internships:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // refresh() only sets state inside its awaited promise callbacks, so no
    // setState runs synchronously in this effect body.
    let active = true;
    Promise.resolve().then(() => {
      if (active) refresh();
    });
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
          My Placements
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your job and internship placements, assigned by the Beyond Intern placement team.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading your placements">
          {[0, 1].map((i) => (
            <div key={i} className="glass-card rounded-[1.75rem] overflow-hidden">
              <div className="skeleton-shimmer h-20" />
              <div className="p-4 sm:p-7 space-y-4">
                <div className="skeleton-shimmer h-10 w-full rounded-full" />
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5">
                  <div className="skeleton-shimmer h-11 rounded-xl" />
                  <div className="skeleton-shimmer h-11 rounded-xl" />
                </div>
                <div className="skeleton-shimmer h-24 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : internships.length === 0 ? (
        <div className="glass-card rounded-[1.75rem] p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-electric/4 via-transparent to-gold/4" />
          <div className="relative">
            <div className="mx-auto mb-5 h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Search className="h-10 w-10 text-slate-500" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-white">No placements assigned yet</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
              Our placement team assigns placements as you progress through your
              programme. Explore current openings on the homepage.
            </p>
            <Link href="/#internships">
              <Button className="mt-6 gradient-electric text-white font-semibold rounded-full px-8 hover:opacity-90 active:scale-[0.98] transition-all">
                Explore Placements
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {internships.map((internship, i) => (
            <PlacementCard
              key={internship.assignment_id}
              internship={internship}
              index={i}
              onUpdated={refresh}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
