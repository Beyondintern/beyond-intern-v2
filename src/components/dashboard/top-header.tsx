"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Search, ChevronDown, LogOut, BookOpen, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { searchCourses } from "@/app/dashboard/courses/actions";
import { motion, AnimatePresence } from "framer-motion";

export function TopHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name || user?.email?.split("@")[0] || "Student";
  const initial = displayName.charAt(0).toUpperCase();
  
  // ── Predictive Search State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [allCourses, setAllCourses] = useState<{ id: string; title: string; category: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchCourses().then(data => setAllCourses(data || []));

    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCourses = searchQuery.trim() === "" 
    ? [] 
    : allCourses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-navy/80 backdrop-blur-xl px-4 md:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors mr-2"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative max-w-md flex-1" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search courses, modules..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="h-9 pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-electric/50 rounded-lg w-full max-w-sm"
        />
        
        <AnimatePresence>
          {showResults && searchQuery.trim() !== "" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 mt-2 w-full max-w-sm bg-navy border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50"
            >
              {filteredCourses.length > 0 ? (
                <ul className="max-h-64 overflow-y-auto py-2">
                  {filteredCourses.map((course) => (
                    <li key={course.id}>
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-electric-light" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium text-white truncate">{course.title}</p>
                          <p className="text-xs text-slate-500 truncate">{course.category}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No courses found for &quot;{searchQuery}&quot;
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link href="/dashboard/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </Link>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors focus:outline-none">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-electric/40"
                />
              ) : (
                <div className="h-8 w-8 rounded-full gradient-electric flex items-center justify-center text-sm font-bold text-white">
                  {initial}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white leading-none">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {user?.email || "Pro Plan"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-navy-light border-white/10"
          >
            <DropdownMenuItem
              render={<Link href="/dashboard" />}
              className="text-slate-300 focus:bg-white/5 focus:text-white"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href="/dashboard/settings" />}
              className="text-slate-300 focus:bg-white/5 focus:text-white"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300 focus:bg-white/5 focus:text-white">
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-rose focus:bg-rose/10 focus:text-rose gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
