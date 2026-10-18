"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  Trophy,
  BadgeCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Briefcase,
  LogOut,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { signOut } from "next-auth/react";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard", tooltip: "Main dashboard overview" },
  { icon: BookOpen, label: "My Courses", href: "/dashboard/courses", tooltip: "View enrolled courses" },
  { icon: Trophy, label: "Achievements", href: "/dashboard/achievements", tooltip: "Your milestones & badges" },
  { icon: BadgeCheck, label: "Certifications", href: "/dashboard/certifications", tooltip: "Download certificates" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications", tooltip: "Alerts & updates" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings", tooltip: "Account & preferences" },
  { icon: Briefcase, label: "My Internships", href: "/dashboard/internships", tooltip: "Assigned internship placements" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const navContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <Link
        href="/"
        className={`flex items-center px-4 h-16 overflow-hidden ${
          !isMobile && collapsed ? "justify-center" : "gap-2"
        }`}
        onClick={isMobile ? onMobileClose : undefined}
      >
        <AnimatePresence>
          {(!collapsed || isMobile) ? (
            <motion.span
              key="full-logo"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-lg font-bold text-white whitespace-nowrap overflow-hidden"
            >
              Beyond<span className="gradient-text">Intern</span>
            </motion.span>
          ) : (
            <motion.span
              key="small-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold text-white whitespace-nowrap"
            >
              BI
            </motion.span>
          )}
        </AnimatePresence>

        {/* Close button (mobile only) */}
        {isMobile && (
          <button
            onClick={(e) => { e.preventDefault(); onMobileClose(); }}
            className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </Link>

      <Separator className="bg-white/5" />

      {/* Nav items */}
      <nav
        className={`flex-1 flex flex-col px-3 py-4 space-y-1 overflow-y-auto ${
          !isMobile && collapsed ? "items-center" : ""
        }`}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={!isMobile && collapsed ? item.tooltip : undefined}
              onClick={isMobile ? onMobileClose : undefined}
            >
              <motion.div
                whileHover={{ x: (!isMobile && collapsed) ? 0 : 2 }}
                className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition-all cursor-pointer ${
                  !isMobile && collapsed ? "justify-center w-11 px-0" : "gap-3 px-3"
                } ${
                  isActive
                    ? "bg-electric/10 text-electric-light"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-electric-light" : ""}`} />
                <AnimatePresence>
                  {(isMobile || !collapsed) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (isMobile || !collapsed) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-electric-light"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-2">
        <Separator className="bg-white/5 mb-2" />
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-rose/10 hover:text-rose transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence>
            {(isMobile || !collapsed) && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Desktop collapse toggle */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-navy-light text-slate-400 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      )}
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:sticky md:flex md:top-0 md:h-screen md:shrink-0 md:z-40 md:flex-col border-r border-white/5 bg-navy-light/95 backdrop-blur-xl relative"
      >
        {navContent(false)}
      </motion.aside>

      {/* ── Mobile Overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Off-Canvas Drawer ─────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r border-white/5 bg-navy-light/98 backdrop-blur-xl md:hidden"
      >
        {navContent(true)}
      </motion.aside>
    </>
  );
}
