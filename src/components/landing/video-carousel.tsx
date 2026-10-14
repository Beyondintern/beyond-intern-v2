"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, Radio, Star } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackSpotlight } from "@/lib/interactions";

interface VideoItem {
  id: string;
  title: string;
  type: "webinar" | "review";
  thumbnail: string;
  duration: string;
  author: string;
  role: string;
  rating?: number;
}

const videos: VideoItem[] = [
  {
    id: "1",
    title: "Live Session: Mastering React Patterns",
    type: "webinar",
    thumbnail: "/thumbnails/webinar-1.jpg",
    duration: "2:45",
    author: "Dr. Sarah Chen",
    role: "Senior Engineer, Google",
    rating: 4.9,
  },
  {
    id: "2",
    title: "\"Beyond Intern changed my career trajectory\"",
    type: "review",
    thumbnail: "/thumbnails/review-1.jpg",
    duration: "1:30",
    author: "James O.",
    role: "Software Developer",
    rating: 5.0,
  },
  {
    id: "3",
    title: "Workshop: System Design Fundamentals",
    type: "webinar",
    thumbnail: "/thumbnails/webinar-2.jpg",
    duration: "3:15",
    author: "Prof. Mark Williams",
    role: "CTO, ScaleUp Labs",
    rating: 4.8,
  },
  {
    id: "4",
    title: "\"I landed my dream job in 3 months!\"",
    type: "review",
    thumbnail: "/thumbnails/review-2.jpg",
    duration: "1:10",
    author: "Priya M.",
    role: "Data Analyst → Data Engineer",
    rating: 5.0,
  },
  {
    id: "5",
    title: "Deep Dive: Cloud Architecture on AWS",
    type: "webinar",
    thumbnail: "/thumbnails/webinar-3.jpg",
    duration: "4:20",
    author: "Alex Rivera",
    role: "Solutions Architect, AWS",
    rating: 4.9,
  },
  {
    id: "6",
    title: "\"The community support is incredible\"",
    type: "review",
    thumbnail: "/thumbnails/review-3.jpg",
    duration: "0:55",
    author: "Fatima K.",
    role: "Full-Stack Developer",
    rating: 5.0,
  },
];

function VideoCard({ video }: { video: VideoItem }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -4 }}
      onPointerMove={trackSpotlight}
      className="glass-card spotlight-card rounded-2xl overflow-hidden min-w-[280px] max-w-[300px] shrink-0 cursor-pointer group active:scale-[0.98] transition-transform"
    >
      {/* Thumbnail — real image with cinematic depth treatment */}
      <div className="relative h-44 flex items-center justify-center overflow-hidden">
        <Image
          src={video.thumbnail}
          alt={`${video.title} — ${video.type === "webinar" ? "webinar session" : "student review"} on Beyond Intern`}
          fill
          sizes="300px"
          className="object-cover"
        />
        {/* Brand-tinted scrim for legibility, deepening on hover */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            isHovered ? "bg-navy/65" : "bg-navy/45"
          }`}
        />
        {/* Electric tint ring ties the imagery back to the brand accent */}
        <div
          className={`pointer-events-none absolute inset-0 mix-blend-overlay transition-opacity duration-500 ${
            video.type === "webinar"
              ? "bg-electric/25"
              : "bg-gold/20"
          } ${isHovered ? "opacity-80" : "opacity-40"}`}
        />

        {/* Play button */}
        <motion.div
          animate={isHovered ? { scale: 1.12 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full glass-strong glow-blue"
        >
          <Play className="h-6 w-6 text-white fill-white ml-0.5" aria-hidden="true" />
        </motion.div>

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {video.duration}
        </div>

        {/* Type badge — icon + label instead of emoji */}
        <div className="absolute top-3 left-3 z-10">
          <Badge
            variant="secondary"
            className={`gap-1 text-xs font-semibold ${
              video.type === "webinar"
                ? "bg-electric/20 text-electric-light border-electric/30"
                : "bg-gold/20 text-gold-light border-gold/30"
            }`}
          >
            {video.type === "webinar" ? (
              <Radio className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            )}
            {video.type === "webinar" ? "Webinar" : "Review"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full gradient-electric flex items-center justify-center text-xs font-bold text-white shrink-0">
            {video.author.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">{video.author}</p>
            <p className="text-[10px] text-slate-500 truncate">{video.role}</p>
          </div>
        </div>
        {video.rating && (
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                aria-hidden="true"
                className={`h-3 w-3 ${
                  i < Math.floor(video.rating!)
                    ? "fill-gold text-gold"
                    : "text-slate-600"
                }`}
              />
            ))}
            <span className="ml-1 text-xs text-slate-400">{video.rating}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function VideoCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-navy-light/50" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-electric/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <Badge className="bg-electric/10 text-electric-light border-electric/20 mb-4">
            Social Proof
          </Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            See What Our <span className="gradient-text">Community</span> Says
          </h2>
          <p className="mt-3 text-lg text-slate-400 max-w-xl">
            Watch real clips from our live webinars and hear from students who
            transformed their careers with Beyond Intern.
          </p>
        </motion.div>

        {/* Carousel controls */}
        <div className="flex justify-end gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="rounded-full border-white/10 text-white hover:bg-white/5 h-10 w-10"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="rounded-full border-white/10 text-white hover:bg-white/5 h-10 w-10"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
        >
          {videos.map((video) => (
            <div key={video.id} className="snap-start">
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
