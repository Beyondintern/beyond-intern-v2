"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Mail, Lock, ArrowRight, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/app/actions/auth";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({ title: "Passwords do not match", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Immediately send welcome email (non-blocking)
      sendWelcomeEmail(email).catch(console.error);

      toast({
        title: "Account created successfully!",
        description: "You can now sign in with your email and password.",
      });
      setIsSignUp(false);
      setIsLoading(false);
    } else {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-bg" />

      {/* Animated gradient blobs */}
      <motion.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-20 h-[400px] w-[400px] rounded-full bg-electric/8 blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 50, -20, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 -right-20 h-[350px] w-[350px] rounded-full bg-gold/6 blur-[120px]"
      />

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-6"
      >
        <div className="absolute -inset-px rounded-3xl bg-linear-to-r from-electric via-gold/50 to-electric bg-size-[200%_auto] animate-gradient opacity-60" />

        <div className="relative rounded-3xl glass-strong p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image
                src="/logo-transparent.png.png"
                alt="Beyond Intern Logo"
                width={187}
                height={50}
                className="object-contain"
                priority
              />
            </Link>
            <h1 className="text-2xl font-bold text-white">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-2 text-sm text-slate-400 text-center">
              {isSignUp 
                ? "Join thousands of students on their journey to excellence" 
                : "Sign in to continue your learning journey"}
            </p>
          </div>

          {/* Google Button (Only for Login) */}
          {!isSignUp && (
            <>
              <Button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                variant="outline"
                className="w-full h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 font-medium text-sm"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-navy px-4 text-slate-400 font-medium">or sign in with email</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative overflow-hidden"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/70 focus:border-electric/50 rounded-xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/70 focus:border-electric/50 rounded-xl"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/70 focus:border-electric/50 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative overflow-hidden"
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/70 focus:border-electric/50 rounded-xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!isSignUp && (
              <div className="flex items-center justify-end text-sm">
                <Link
                  href="mailto:info@beyondintern.com?subject=Password%20Reset%20Request"
                  className="text-electric-light hover:text-electric transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity text-base mt-2"
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle link */}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-6 w-full text-center text-sm text-slate-400 hover:text-white transition-colors"
          >
            {isSignUp ? (
              <>Already have an account? <span className="font-medium text-electric-light">Sign In</span></>
            ) : (
              <>Don&apos;t have an account? <span className="font-medium text-electric-light">Create one free</span></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
