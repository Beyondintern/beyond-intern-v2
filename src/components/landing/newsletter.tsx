"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { trackSpotlight } from "@/lib/interactions";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      const result = await subscribeToNewsletter(email);

      if (result.success) {
        setSubmitted(true);
        setEmail("");
        toast({
          title: "You're on the list! 🎉",
          description: result.message,
        });
        // Reset success banner after 4 seconds so user can re-view the form
        setTimeout(() => setSubmitted(false), 4000);
      } else {
        toast({
          title: "Subscription failed",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-b from-navy via-navy-light to-navy" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-electric/5 blur-[200px]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-electric/20 to-transparent" />

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex mb-6"
          >
            <Sparkles className="h-10 w-10 text-gold" />
          </motion.div>

          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Stay <span className="gradient-text">Ahead</span> of the Curve
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-lg mx-auto">
            Get exclusive early access to new courses, webinar invites, and
            career insights delivered straight to your inbox.
          </p>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card spotlight-card rounded-2xl p-6 max-w-md mx-auto" onPointerMove={trackSpotlight}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald/20">
                    <Check className="h-5 w-5 text-emerald" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">
                      You&apos;re in!
                    </p>
                    <p className="text-xs text-slate-400">
                      Check your inbox for a welcome gift 🎁
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex max-w-md flex-col items-center gap-3 sm:flex-row"
              >
                <div className="relative w-full">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isPending}
                    className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-electric/50 rounded-full sm:rounded-r-none disabled:opacity-60"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-12 gradient-electric text-white font-semibold rounded-full px-8 glow-blue hover:opacity-90 transition-opacity w-full sm:w-auto sm:rounded-l-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          <p className="mt-4 text-xs text-slate-600">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
