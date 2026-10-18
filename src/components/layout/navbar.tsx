"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSession, signOut } from "next-auth/react";

const navLinks = [
  { name: "Courses", href: "/#courses" },
  { name: "Webinars", href: "/#webinars" },
  { name: "Internships", href: "/#internships" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Associations", href: "/collaborations" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="absolute top-0 left-0 w-full z-50 bg-transparent">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo-transparent.png.png"
            alt="Beyond Intern Logo"
            width={225}
            height={60}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white hover:bg-white/5"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions — Dynamic based on auth state */}
        <div className="hidden items-center gap-3 md:flex">
          {status === "loading" ? (
            <div className="h-9 w-20 rounded-full bg-white/5 animate-pulse" />
          ) : session?.user ? (
            /* Logged in: show avatar, name, sign out */
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-full glass px-3 py-1.5 border border-white/10 hover:border-electric/30 transition-colors group"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={28}
                    height={28}
                    className="rounded-full ring-2 ring-electric/40"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full gradient-electric flex items-center justify-center text-xs font-bold text-white">
                    {(session.user.name || session.user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                  {session.user.name || session.user.email?.split("@")[0]}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            /* Logged out: show Login / Get Started */
            <>
              <Link href="/login">
                <Button className="gradient-electric text-white font-semibold rounded-full px-6 glow-blue hover:opacity-90 transition-opacity">
                  Login
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10"
                aria-label="Open menu"
              />
            }
          >
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 border-white/10 bg-navy-light/95 backdrop-blur-xl"
          >
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="flex flex-col gap-6 pt-8">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo-transparent.png.png"
                  alt="Beyond Intern Logo"
                  width={195}
                  height={52}
                  className="object-contain"
                />
              </Link>

              {/* User info in mobile (if logged in) */}
              {session?.user && (
                <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl border border-white/10">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={36}
                      height={36}
                      className="rounded-full ring-2 ring-electric/40"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full gradient-electric flex items-center justify-center text-sm font-bold text-white">
                      {(session.user.name || session.user.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {session.user.name ||
                        session.user.email?.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.name}
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-3 mt-6 border-t border-white/10 pt-6">
                {session?.user ? (
                  <>
                    <Link href="/dashboard">
                      <Button className="w-full gradient-electric text-white font-semibold rounded-full glow-blue">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full border-white/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button className="w-full gradient-electric text-white font-semibold rounded-full glow-blue">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
