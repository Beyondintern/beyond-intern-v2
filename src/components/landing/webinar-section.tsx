"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, Clock, ExternalLink, Mic, Sparkles } from "lucide-react";
import Link from "next/link";
import { getActiveWebinar, registerForWebinar } from "@/app/dashboard/admin/actions";
import { trackSpotlight } from "@/lib/interactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ActiveWebinar {
  id: string;
  title: string;
  speaker: string | null;
  webinar_date: string | null;
  webinar_time: string | null;
}

const CAREER_INTERESTS = ["Marketing", "Finance", "Data Science", "Web Development", "HR", "Entrepreneurship"];

function parseEventDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value.replace(/(\d+)(st|nd|rd|th)/, "$1"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function WebinarSection() {
  const [webinar, setWebinar] = useState<ActiveWebinar | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [regError, setRegError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    getActiveWebinar().then((data) => {
      if (data) setWebinar(data as ActiveWebinar);
    });
  }, []);

  const eventDate = parseEventDate(webinar?.webinar_date ?? null);
  const eventState = !webinar ? "none" : eventDate && eventDate.getTime() > now ? "upcoming" : "past";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!webinar || !fullName.trim() || !email.trim()) return;
    setSubmitting(true);
    setRegError("");
    const result = await registerForWebinar({ full_name: fullName, email });
    setSubmitting(false);
    if (!result.success) {
      setRegError((result as { message?: string }).message || "Registration failed.");
      return;
    }
    setRegistered(true);
    formRef.current?.reset();
    setFullName("");
    setEmail("");
    setInterests([]);
  }

  return (
    <section id="webinars" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-navy-light/50" aria-hidden="true" />
      <div className="absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-electric/20 to-transparent" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 text-center">
          <Badge className="mb-4 border-electric/20 bg-electric/10 text-electric-light">Live &amp; On-Demand</Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Premium <span className="gradient-text">Webinars</span></h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-slate-400">Hear from industry experts live. Register below to secure your spot.</p>
        </motion.div>

        <div className="grid items-start gap-10 lg:grid-cols-5">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex flex-col gap-6 lg:col-span-2">
            <div className="glass-card spotlight-card rounded-2xl p-6" onPointerMove={trackSpotlight}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-electric glow-blue"><Sparkles className="h-6 w-6 text-white" aria-hidden="true" /></div>
                <div><h3 className="text-lg font-bold text-white">{webinar?.title || "No upcoming webinar scheduled"}</h3><p className="text-xs text-slate-400">{webinar ? "Beyond Intern Live Webinar" : "Join the newsletter for the next event invite"}</p></div>
              </div>
              {webinar ? <div className="space-y-4 text-sm text-slate-300"><div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-electric-light" aria-hidden="true" /><span><strong className="text-white">Date:</strong> {webinar.webinar_date}</span></div>{webinar.webinar_time && <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-electric-light" aria-hidden="true" /><span><strong className="text-white">Time:</strong> {webinar.webinar_time}</span></div>}<div className="flex items-center gap-3"><Mic className="h-4 w-4 text-electric-light" aria-hidden="true" /><span><strong className="text-white">Speaker:</strong> {webinar.speaker || "To be announced"}</span></div></div> : <p className="text-sm text-slate-400">Subscribe below and we&apos;ll let you know when the next session opens.</p>}
            </div>
            {eventState === "upcoming" && <div className="glass-card rounded-2xl p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming Schedule</p><Link href="/webinar/live"><Button className="flex h-auto w-full items-center justify-center gap-2 rounded-xl gradient-electric py-3 text-xs font-bold text-white glow-blue"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />View Webinar Details<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Button></Link></div>}
            {eventState === "past" && <div className="glass-card rounded-2xl p-5"><p className="text-sm text-slate-400">This session has ended. Subscribe for the next live event.</p></div>}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-3">
            <div className="glass-card spotlight-card rounded-2xl p-7" onPointerMove={trackSpotlight}>
              <AnimatePresence mode="wait">
                {registered ? <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10"><CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden="true" /></div><h3 className="mb-2 text-2xl font-bold text-white">You&apos;re Registered!</h3><p className="max-w-xs leading-relaxed text-slate-400">Your spot is secured. We&apos;ll send the webinar link to your inbox before the event.</p></motion.div> : <motion.form key="form" ref={formRef} onSubmit={handleSubmit} className="space-y-6"><div><h3 className="mb-1 text-lg font-bold text-white">{eventState === "none" ? "Get the next webinar invite" : "Register for Free"}</h3><p className="text-xs text-slate-400">Secure your spot in minutes.</p></div><fieldset><legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Information</legend><div className="grid gap-3 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="webinar-full-name" className="sr-only">Full name</label><Input id="webinar-full-name" required placeholder="Full Name *" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={!webinar || submitting} className="bg-white/5 text-white" /></div><div><label htmlFor="webinar-email" className="sr-only">Email address</label><Input id="webinar-email" required type="email" placeholder="Email Address *" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!webinar || submitting} className="bg-white/5 text-white" /></div><div><label htmlFor="webinar-phone" className="sr-only">Phone number</label><Input id="webinar-phone" type="tel" placeholder="Phone Number" disabled={!webinar || submitting} className="bg-white/5 text-white" /></div></div></fieldset><fieldset disabled={!webinar || submitting}><legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Career interests</legend><div className="flex flex-wrap gap-2">{CAREER_INTERESTS.map((interest) => <button key={interest} type="button" aria-pressed={interests.includes(interest)} onClick={() => setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest])} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-light">{interest}</button>)}</div></fieldset>{regError && <p className="text-sm text-rose-300" role="alert">{regError}</p>}<Button type="submit" disabled={!webinar || submitting} className="h-12 w-full rounded-xl gradient-electric font-semibold text-white glow-blue">{submitting ? "Registering…" : eventState === "none" ? "Notify Me" : "Secure My Spot"}</Button><p className="text-center text-[11px] text-slate-500">By registering, you agree to receive event details from Beyond Intern.</p></motion.form>}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
