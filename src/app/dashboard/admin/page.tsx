"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  UserPlus,
  CheckCircle,
  AlertCircle,
  BookOpen,
  BarChart3,
  PlusCircle,
  Trash2,
  Pencil,
  Users,
  GraduationCap,
  Database,
  Radio,
  Calendar,
  Clock,
  Mic,
  Mail,
  Bell,
  Handshake,
  ImageIcon,
  Globe,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { courseData } from "@/lib/courses";
import {
  assignCourse,
  upsertCourse,
  deleteCourse,
  fetchAllCourses,
  fetchRegisteredUsers,
  fetchActiveEnrollments,
  migrateHardcodedCourses,
  upsertWebinar,
  getActiveWebinar,
  getWebinarRegistrations,
  sendNotification,
  fetchCarouselImages,
  insertCarouselImage,
  deleteCarouselImage,
  fetchBrandPartners,
  insertBrandPartner,
  deleteBrandPartner,
  fetchPressArticles,
  insertPressArticle,
  deletePressArticle,
} from "./actions";
import type { CarouselImageRow, BrandPartnerRow, PressArticleRow } from "./actions";

const ADMIN_EMAILS = ["info@beyondintern.com", "ansupoddar11@gmail.com"];

type Status = "idle" | "loading" | "success" | "error";
type Tab = "enrol" | "courses" | "analytics" | "webinars" | "notifications" | "collabs";

interface VideoModule {
  id: string;
  title: string;
  youtube_id: string;
}

interface SyllabusModule {
  id: string;
  month: string;
  weeks: string;
  topics: string;
}

interface RawCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: string;
  outcomes: string;
  price?: string | null;
  image_url?: string;
  youtube_id?: string | null;
  video_modules?: VideoModule[] | string;
  curriculum_syllabus?: SyllabusModule[] | string;
  schedule_text?: string | null;
  assignment_link?: string | null;
  created_at?: string;
}

interface RegUser {
  id: string;
  email: string;
  created_at: string;
}

interface Enrollment {
  user_email: string;
  course_id: string;
  created_at: string;
}

interface WebinarRow {
  id: string;
  title: string;
  speaker: string;
  webinar_date: string;
  webinar_time: string;
  is_active: boolean;
}

interface WebinarReg {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  webinar_id: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("enrol");

  // ── Enrol State ──
  const [userEmail, setUserEmail] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [submitStatus, setSubmitStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  // ── Course Management State ──
  const [courseForm, setCourseForm] = useState({
    id: "",
    title: "",
    description: "",
    category: "",
    duration: "",
    level: "",
    outcomes: "",
    price: "",
    image_url: "",
    video_modules: [] as VideoModule[],
    curriculum_syllabus: [] as SyllabusModule[],
    schedule_text: "",
    assignment_link: "",
    image_file: null as File | null,
  });
  const [migrateStatus, setMigrateStatus] = useState<Status>("idle");
  const [migrateMsg, setMigrateMsg] = useState("");
  const [courseStatus, setCourseStatus] = useState<Status>("idle");
  const [courseMsg, setCourseMsg] = useState("");
  const [publishedCourses, setPublishedCourses] = useState<RawCourse[]>([]);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);

  // ── Analytics State ──
  const [registeredUsers, setRegisteredUsers] = useState<RegUser[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  // ── Webinar State ──
  const [activeWebinar, setActiveWebinar] = useState<WebinarRow | null>(null);
  const [webinarForm, setWebinarForm] = useState({ title: "", speaker: "", webinar_date: "", webinar_time: "" });
  const [webinarStatus, setWebinarStatus] = useState<Status>("idle");
  const [webinarMsg, setWebinarMsg] = useState("");
  const [webinarRegs, setWebinarRegs] = useState<WebinarReg[]>([]);

  // ── Notifications State ──
  const [notifMode, setNotifMode] = useState<"broadcast" | "direct">("broadcast");
  const [notifCourseId, setNotifCourseId] = useState("");
  const [notifEmail, setNotifEmail] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifStatus, setNotifStatus] = useState<Status>("idle");
  const [notifMsg, setNotifMsg] = useState("");

  // ── Collaborations & Press State ──
  const [carouselImages, setCarouselImages] = useState<CarouselImageRow[]>([]);
  const [carouselUrl, setCarouselUrl] = useState("");
  const [carouselOrientation, setCarouselOrientation] = useState<"landscape" | "portrait">("landscape");
  const [brandPartners, setBrandPartners] = useState<BrandPartnerRow[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandLink, setBrandLink] = useState("");
  const [pressArticles, setPressArticles] = useState<PressArticleRow[]>([]);
  const [pressPublisher, setPressPublisher] = useState("");
  const [pressLink, setPressLink] = useState("");
  const [collabStatus, setCollabStatus] = useState<Status>("idle");
  const [collabMsg, setCollabMsg] = useState("");

  const isAdmin =
    session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  // ── Data Fetchers (defined outside effect so handlers can call them) ──
  const loadCourses = useCallback(async () => {
    const data = await fetchAllCourses();
    setPublishedCourses(data as RawCourse[]);
  }, []);

  const loadAnalytics = useCallback(async () => {
    const [users, enrols] = await Promise.all([
      fetchRegisteredUsers(),
      fetchActiveEnrollments(),
    ]);
    setRegisteredUsers(users as RegUser[]);
    setEnrollments(enrols as Enrollment[]);
  }, []);

  const loadWebinar = useCallback(async () => {
    const [webinar, regs] = await Promise.all([
      getActiveWebinar(),
      getWebinarRegistrations(),
    ]);
    const w = webinar as WebinarRow | null;
    setActiveWebinar(w);
    if (w) {
      setWebinarForm({ title: w.title, speaker: w.speaker || "", webinar_date: w.webinar_date || "", webinar_time: w.webinar_time || "" });
    }
    setWebinarRegs(regs as WebinarReg[]);
  }, []);

  const loadCollabs = useCallback(async () => {
    const [images, brands, press] = await Promise.all([
      fetchCarouselImages(),
      fetchBrandPartners(),
      fetchPressArticles(),
    ]);
    setCarouselImages(images);
    setBrandPartners(brands);
    setPressArticles(press);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    // Kick loaders off from a microtask so no setState can run synchronously
    // inside this effect body — each loader only sets state after its awaits.
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      void Promise.all([
        loadCourses(),
        loadAnalytics(),
        loadWebinar(),
        loadCollabs(),
      ]);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // ── Enrol Handler ──
  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!userEmail || !selectedCourseId) return;
    setSubmitStatus("loading");
    setMessage("");
    const result = await assignCourse(userEmail, selectedCourseId);
    if (result.success) {
      setMessage(
        `Successfully enrolled ${userEmail} in "${courseData.find((c) => c.id === selectedCourseId)?.title}".`
      );
      setSubmitStatus("success");
      setUserEmail("");
      setSelectedCourseId("");
      loadAnalytics();
    } else {
      setMessage(result.message || "Failed to assign course.");
      setSubmitStatus("error");
    }
  }

  // ── Course Publish Handler ──
  async function handlePublishCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!courseForm.id || !courseForm.title) return;
    setCourseStatus("loading");
    setCourseMsg("");

    const formData = new FormData();
    formData.append("id", courseForm.id);
    formData.append("title", courseForm.title);
    formData.append("description", courseForm.description);
    formData.append("category", courseForm.category);
    formData.append("duration", courseForm.duration);
    formData.append("level", courseForm.level);
    formData.append("outcomes", courseForm.outcomes);
    formData.append("price", courseForm.price);
    formData.append("image_url", courseForm.image_url);
    formData.append("video_modules", JSON.stringify(courseForm.video_modules));
    formData.append("curriculum_syllabus", JSON.stringify(courseForm.curriculum_syllabus));
    formData.append("schedule_text", courseForm.schedule_text);
    formData.append("assignment_link", courseForm.assignment_link);
    
    if (courseForm.image_file) {
      formData.append("image", courseForm.image_file);
    }

    const result = await upsertCourse(formData);
    if (result.success) {
      setCourseMsg(
        editingCourse ? "Course updated successfully!" : "Course published successfully!"
      );
      setCourseStatus("success");
      setCourseForm({ id: "", title: "", description: "", category: "", duration: "", level: "", outcomes: "", price: "", image_url: "", video_modules: [] as VideoModule[], curriculum_syllabus: [] as SyllabusModule[], schedule_text: "", assignment_link: "", image_file: null });
      setEditingCourse(null);
      loadCourses();
    } else {
      setCourseMsg(result.message || "Failed to publish course.");
      setCourseStatus("error");
    }
  }

  // ── Course Delete Handler ──
  async function handleDeleteCourse(courseId: string) {
    if (!confirm("Remove this course permanently?")) return;
    const result = await deleteCourse(courseId);
    if (result.success) loadCourses();
  }

  // ── Edit Prefill ──
  function handleEditCourse(course: RawCourse) {
    let parsedVideoModules: VideoModule[] = [];
    if (typeof course.video_modules === "string") {
      try {
        parsedVideoModules = JSON.parse(course.video_modules);
      } catch {
        parsedVideoModules = [];
      }
    } else if (Array.isArray(course.video_modules)) {
      parsedVideoModules = course.video_modules;
    }

    // Legacy fallback: if no video_modules exist but a bare youtube_id does,
    // seed the list with it so existing content is not lost.
    if (parsedVideoModules.length === 0 && course.youtube_id) {
      parsedVideoModules = [{ id: crypto.randomUUID(), title: "Main Video", youtube_id: course.youtube_id }];
    }

    let parsedSyllabus: SyllabusModule[] = [];
    if (typeof course.curriculum_syllabus === "string") {
      try {
        parsedSyllabus = JSON.parse(course.curriculum_syllabus);
      } catch {
        parsedSyllabus = [];
      }
    } else if (Array.isArray(course.curriculum_syllabus)) {
      parsedSyllabus = course.curriculum_syllabus;
    }

    setCourseForm({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      duration: course.duration,
      level: course.level,
      outcomes: course.outcomes,
      price: course.price || "",
      image_url: course.image_url || "",
      video_modules: parsedVideoModules,
      curriculum_syllabus: parsedSyllabus,
      schedule_text: course.schedule_text || "",
      assignment_link: course.assignment_link || "",
      image_file: null,
    });
    setEditingCourse(course.id);
    setActiveTab("courses");
  }

  // ── Migration Handler ──
  async function handleMigrate() {
    if (!confirm("This will upsert all 30+ hardcoded courses into the database. Continue?")) return;
    setMigrateStatus("loading");
    setMigrateMsg("");
    const result = await migrateHardcodedCourses();
    if (result.success) {
      setMigrateMsg(`Successfully migrated ${(result as { count: number }).count} courses!`);
      setMigrateStatus("success");
      loadCourses();
    } else {
      setMigrateMsg((result as { message: string }).message || "Migration failed.");
      setMigrateStatus("error");
    }
  }

  // ── Webinar Save Handler ──
  async function handleSaveWebinar(e: React.FormEvent) {
    e.preventDefault();
    setWebinarStatus("loading");
    setWebinarMsg("");
    const result = await upsertWebinar({
      id: activeWebinar?.id,
      ...webinarForm,
    });
    if (result.success) {
      setWebinarMsg("Webinar updated successfully!");
      setWebinarStatus("success");
      loadWebinar();
    } else {
      setWebinarMsg((result as { message?: string }).message || "Failed to save webinar.");
      setWebinarStatus("error");
    }
  }

  // ── Notification Handler ──
  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    if (notifMode === "broadcast" && !notifCourseId) return;
    if (notifMode === "direct" && !notifEmail) return;

    setNotifStatus("loading");
    setNotifMsg("");

    const result = await sendNotification({
      title: notifTitle,
      message: notifMessage,
      type: notifMode,
      course_id: notifMode === "broadcast" ? notifCourseId : undefined,
      target_email: notifMode === "direct" ? notifEmail : undefined,
    });

    if (result.success) {
      setNotifMsg("Notification sent successfully!");
      setNotifStatus("success");
      setNotifTitle("");
      setNotifMessage("");
      if (notifMode === "direct") setNotifEmail("");
    } else {
      setNotifMsg(result.message || "Failed to send notification.");
      setNotifStatus("error");
    }
  }

  // ── Collab Handlers ──
  async function handleAddCarouselImage() {
    if (!carouselUrl.trim()) return;
    setCollabStatus("loading");
    const result = await insertCarouselImage(carouselUrl, carouselOrientation);
    if (result.success) {
      setCarouselUrl("");
      setCarouselOrientation("landscape");
      setCollabMsg("Carousel image added!");
      setCollabStatus("success");
      loadCollabs();
    } else {
      setCollabMsg(result.message || "Failed.");
      setCollabStatus("error");
    }
  }

  async function handleDeleteCarouselImage(id: string) {
    if (!confirm("Delete this carousel image?")) return;
    await deleteCarouselImage(id);
    loadCollabs();
  }

  async function handleAddBrand() {
    if (!brandName.trim() || !brandLink.trim()) return;
    setCollabStatus("loading");
    const result = await insertBrandPartner(brandName, brandLink);
    if (result.success) {
      setBrandName("");
      setBrandLink("");
      setCollabMsg("Brand partner added!");
      setCollabStatus("success");
      loadCollabs();
    } else {
      setCollabMsg(result.message || "Failed.");
      setCollabStatus("error");
    }
  }

  async function handleDeleteBrand(id: string) {
    if (!confirm("Remove this brand partner?")) return;
    await deleteBrandPartner(id);
    loadCollabs();
  }

  async function handleAddPress() {
    if (!pressPublisher.trim() || !pressLink.trim()) return;
    setCollabStatus("loading");
    const result = await insertPressArticle(pressPublisher, pressLink);
    if (result.success) {
      setPressPublisher("");
      setPressLink("");
      setCollabMsg("Press article added!");
      setCollabStatus("success");
      loadCollabs();
    } else {
      setCollabMsg(result.message || "Failed.");
      setCollabStatus("error");
    }
  }

  async function handleDeletePress(id: string) {
    if (!confirm("Remove this press article?")) return;
    await deletePressArticle(id);
    loadCollabs();
  }

  /* Loading skeleton */
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-electric/30 border-t-electric animate-spin" />
      </div>
    );
  }

  /* Access denied */
  if (!session || !isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto mt-16"
      >
        <div className="mx-auto mb-5 h-20 w-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          You do not have permission to access the admin panel.
        </p>
      </motion.div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "enrol", label: "Enrol Student", icon: <UserPlus className="h-4 w-4" /> },
    { key: "courses", label: "Manage Courses", icon: <BookOpen className="h-4 w-4" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "webinars", label: "Manage Webinars", icon: <Radio className="h-4 w-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { key: "collabs", label: "Collabs & Press", icon: <Handshake className="h-4 w-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl"
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.key
                ? "gradient-electric text-white glow-blue shadow-lg"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ════════════════════════ TAB 1: ENROL STUDENT ═══════════════════════ */}
        {activeTab === "enrol" && (
          <motion.div key="enrol" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-electric-light" />
                Admin — Enrol a Student
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Assign a course to any registered user by their email address.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 space-y-6">
              <form onSubmit={handleAssign} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Student Email</label>
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Select Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white px-3 text-sm focus:outline-none focus:border-electric/50 transition-colors"
                  >
                    <option value="" disabled className="bg-slate-900">— Choose a course —</option>
                    {courseData.map((course) => (
                      <option key={course.id} value={course.id} className="bg-slate-900">
                        [{course.category}] {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCourseId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-xl bg-electric/5 border border-electric/20 text-sm text-slate-300 flex items-start gap-3"
                  >
                    <BookOpen className="h-4 w-4 text-electric-light mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-white">
                        {courseData.find((c) => c.id === selectedCourseId)?.title}
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        {courseData.find((c) => c.id === selectedCourseId)?.duration}{" "}·{" "}
                        {courseData.find((c) => c.id === selectedCourseId)?.level}
                      </p>
                    </div>
                  </motion.div>
                )}

                {submitStatus !== "idle" && submitStatus !== "loading" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                      submitStatus === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                    }`}
                  >
                    {submitStatus === "success" ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    )}
                    {message}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={submitStatus === "loading"}
                  className="w-full h-11 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity"
                >
                  {submitStatus === "loading" ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enrol Student
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ════════════════════ TAB 2: MANAGE COURSES ════════════════════════ */}
        {activeTab === "courses" && (
          <motion.div key="courses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <PlusCircle className="h-6 w-6 text-electric-light" />
                {editingCourse ? "Edit Course" : "Publish a New Course"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {editingCourse
                  ? "Modify the course details and save your changes."
                  : "Fill out the form to publish a course to the website."}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <form onSubmit={handlePublishCourse} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Course ID (Unique Slug)</label>
                    <Input
                      placeholder="e.g. rfscVS0vtbw"
                      value={courseForm.id}
                      onChange={(e) => setCourseForm({ ...courseForm, id: e.target.value })}
                      required
                      disabled={!!editingCourse}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Title</label>
                    <Input
                      placeholder="Course title"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      required
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    placeholder="Detailed course description..."
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-electric/50 transition-colors placeholder:text-white/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Category</label>
                    <Input
                      placeholder="e.g. Technical Skills"
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Duration</label>
                    <Input
                      placeholder="e.g. 16 Weeks"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Level</label>
                    <Input
                      placeholder="e.g. Beginner"
                      value={courseForm.level}
                      onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Price</label>
                  <Input
                    placeholder='e.g. £650 or "Free"'
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Outcomes (one per line)</label>
                  <textarea
                    placeholder={"Junior Developer\nBackend Engineer\nAutomation Specialist"}
                    value={courseForm.outcomes}
                    onChange={(e) => setCourseForm({ ...courseForm, outcomes: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-electric/50 transition-colors placeholder:text-white/40 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Course Image (Max 500KB)</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCourseForm({ ...courseForm, image_file: e.target.files?.[0] || null })}
                    className="h-11 bg-white/5 border-white/10 text-white focus:border-electric/50 rounded-xl"
                  />
                  {courseForm.image_url && !courseForm.image_file && (
                    <p className="text-xs text-slate-400 mt-1">Current Image: {courseForm.image_url}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Schedule Text</label>
                  <Input 
                    placeholder="e.g. Next class: Friday 6 PM"
                    value={courseForm.schedule_text}
                    onChange={(e) => setCourseForm({ ...courseForm, schedule_text: e.target.value })}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Assignment Link</label>
                  <Input 
                    placeholder="e.g. https://forms.gle/..."
                    value={courseForm.assignment_link}
                    onChange={(e) => setCourseForm({ ...courseForm, assignment_link: e.target.value })}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-electric/50 rounded-xl"
                  />
                </div>

                {/* Video Modules */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Video Modules</label>
                    <Button
                      type="button"
                      onClick={() => setCourseForm({
                        ...courseForm,
                        video_modules: [...courseForm.video_modules, { id: crypto.randomUUID(), title: "", youtube_id: "" }]
                      })}
                      className="h-8 px-3 text-xs bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10"
                    >
                      <PlusCircle className="mr-1.5 h-3 w-3" /> Add Video
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {courseForm.video_modules.map((mod: VideoModule, mIndex: number) => (
                      <div key={mod.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            const newMods = [...courseForm.video_modules];
                            newMods.splice(mIndex, 1);
                            setCourseForm({ ...courseForm, video_modules: newMods });
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-md text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400">Title</label>
                            <Input 
                              placeholder="e.g. Introduction to React"
                              value={mod.title}
                              onChange={(e) => {
                                const newMods = [...courseForm.video_modules];
                                newMods[mIndex].title = e.target.value;
                                setCourseForm({ ...courseForm, video_modules: newMods });
                              }}
                              className="h-9 bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400">YouTube ID</label>
                            <Input 
                              placeholder="e.g. dQw4w9WgXcQ"
                              value={mod.youtube_id}
                              onChange={(e) => {
                                const newMods = [...courseForm.video_modules];
                                newMods[mIndex].youtube_id = e.target.value;
                                setCourseForm({ ...courseForm, video_modules: newMods });
                              }}
                              className="h-9 bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {courseForm.video_modules.length === 0 && (
                      <div className="p-6 rounded-xl border border-dashed border-white/20 text-center">
                        <p className="text-sm text-slate-400">No video modules added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Curriculum Syllabus */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Curriculum Syllabus</label>
                    <Button
                      type="button"
                      onClick={() => setCourseForm({
                        ...courseForm,
                        curriculum_syllabus: [...courseForm.curriculum_syllabus, { id: crypto.randomUUID(), month: "", weeks: "", topics: "" }]
                      })}
                      className="h-8 px-3 text-xs bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10"
                    >
                      <PlusCircle className="mr-1.5 h-3 w-3" /> Add Syllabus Module
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {courseForm.curriculum_syllabus.map((mod: SyllabusModule, mIndex: number) => (
                      <div key={mod.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            const newSyl = [...courseForm.curriculum_syllabus];
                            newSyl.splice(mIndex, 1);
                            setCourseForm({ ...courseForm, curriculum_syllabus: newSyl });
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-md text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400">Month</label>
                            <Input 
                              placeholder="e.g. Month 1"
                              value={mod.month}
                              onChange={(e) => {
                                const newSyl = [...courseForm.curriculum_syllabus];
                                newSyl[mIndex].month = e.target.value;
                                setCourseForm({ ...courseForm, curriculum_syllabus: newSyl });
                              }}
                              className="h-9 bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400">Weeks</label>
                            <Input 
                              placeholder="e.g. Week 1-2"
                              value={mod.weeks}
                              onChange={(e) => {
                                const newSyl = [...courseForm.curriculum_syllabus];
                                newSyl[mIndex].weeks = e.target.value;
                                setCourseForm({ ...courseForm, curriculum_syllabus: newSyl });
                              }}
                              className="h-9 bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1 mt-3">
                          <label className="text-xs text-slate-400">Topics</label>
                          <textarea 
                            placeholder="e.g. Introduction to HTML, CSS basics"
                            value={mod.topics}
                            rows={2}
                            onChange={(e) => {
                              const newSyl = [...courseForm.curriculum_syllabus];
                              newSyl[mIndex].topics = e.target.value;
                              setCourseForm({ ...courseForm, curriculum_syllabus: newSyl });
                            }}
                            className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-2 text-sm focus:outline-none focus:border-electric/50 transition-colors placeholder:text-white/40 resize-none"
                          />
                        </div>
                      </div>
                    ))}
                    {courseForm.curriculum_syllabus.length === 0 && (
                      <div className="p-6 rounded-xl border border-dashed border-white/20 text-center">
                        <p className="text-sm text-slate-400">No syllabus modules added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {courseStatus !== "idle" && courseStatus !== "loading" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                      courseStatus === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                    }`}
                  >
                    {courseStatus === "success" ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                    {courseMsg}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={courseStatus === "loading"}
                    className="flex-1 h-11 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity"
                  >
                    {courseStatus === "loading" ? (
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : editingCourse ? (
                      <><Pencil className="mr-2 h-4 w-4" /> Update Course</>
                    ) : (
                      <><PlusCircle className="mr-2 h-4 w-4" /> Publish Course</>
                    )}
                  </Button>
                  {editingCourse && (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditingCourse(null);
                        setCourseForm({ id: "", title: "", description: "", category: "", duration: "", level: "", outcomes: "", price: "", image_url: "", video_modules: [] as VideoModule[], curriculum_syllabus: [] as SyllabusModule[], schedule_text: "", assignment_link: "", image_file: null });
                      }}
                      className="h-11 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Published Courses List */}
            {publishedCourses.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-electric-light" />
                  Published Courses ({publishedCourses.length})
                </h2>
                <div className="space-y-2">
                  {publishedCourses.map((c) => (
                    <div
                      key={c.id}
                      className="glass-card rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.category} · {c.duration} · {c.level}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditCourse(c)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.id)}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Migrate Old Courses */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-amber-400" />
                Data Migration
              </h2>
              <p className="text-xs text-slate-400">
                Bulk-upsert all 30+ hardcoded courses from the codebase into the Supabase raw_courses table.
              </p>
              {migrateStatus !== "idle" && migrateStatus !== "loading" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl flex items-start gap-3 text-sm ${
                    migrateStatus === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                  }`}
                >
                  {migrateStatus === "success" ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                  {migrateMsg}
                </motion.div>
              )}
              <Button
                onClick={handleMigrate}
                disabled={migrateStatus === "loading"}
                className="h-11 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl hover:bg-amber-500/20 transition-colors font-semibold"
              >
                {migrateStatus === "loading" ? (
                  <div className="h-5 w-5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Migrate Old Courses to DB
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════ TAB 3: ANALYTICS ═════════════════════════════ */}
        {activeTab === "analytics" && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-electric-light" />
                Student Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Overview of registered users and active enrollments.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{registeredUsers.length}</p>
                  <p className="text-xs text-slate-400">Registered Users</p>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{enrollments.length}</p>
                  <p className="text-xs text-slate-400">Active Enrollments</p>
                </div>
              </div>
            </div>

            {/* Registered Users List */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Registered Users
              </h2>
              {registeredUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No users found.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {registeredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/3 hover:bg-white/6 transition-colors"
                    >
                      <span className="text-sm text-slate-300 truncate">{u.email}</span>
                      <span className="text-[10px] text-slate-600 shrink-0 ml-3">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Enrollments List */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-400" />
                Active Enrollments
              </h2>
              {enrollments.length === 0 ? (
                <p className="text-sm text-slate-500">No enrollments yet.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {enrollments.map((en, i) => (
                    <div
                      key={`${en.user_email}-${en.course_id}-${i}`}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/3 hover:bg-white/6 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-300 truncate">{en.user_email}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {courseData.find((c) => c.id === en.course_id)?.title || en.course_id}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0 ml-3">
                        {new Date(en.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
        {/* ════════════════════ TAB 4: MANAGE WEBINARS ════════════════════════ */}
        {activeTab === "webinars" && (
          <motion.div key="webinars" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Radio className="h-6 w-6 text-electric-light" />
                Manage Webinars
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Update the active webinar details and view registered candidates.
              </p>
            </div>

            {/* ── Webinar Form ── */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
                <Radio className="h-4 w-4 text-electric-light" />
                Active Webinar Details
                {activeWebinar && (
                  <span className="ml-2 text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LIVE
                  </span>
                )}
              </h2>
              <form onSubmit={handleSaveWebinar} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-slate-500" /> Webinar Title
                  </label>
                  <Input
                    required
                    placeholder="e.g. Boost Your Career & Land Internships"
                    value={webinarForm.title}
                    onChange={(e) => setWebinarForm({ ...webinarForm, title: e.target.value })}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-slate-500" /> Speaker Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Nandani Sharma"
                    value={webinarForm.speaker}
                    onChange={(e) => setWebinarForm({ ...webinarForm, speaker: e.target.value })}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" /> Date
                    </label>
                    <Input
                      required
                      placeholder="e.g. 29th March 2026"
                      value={webinarForm.webinar_date}
                      onChange={(e) => setWebinarForm({ ...webinarForm, webinar_date: e.target.value })}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" /> Time
                    </label>
                    <Input
                      required
                      placeholder="e.g. 7:00 PM IST"
                      value={webinarForm.webinar_time}
                      onChange={(e) => setWebinarForm({ ...webinarForm, webinar_time: e.target.value })}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                    />
                  </div>
                </div>

                {webinarStatus !== "idle" && webinarStatus !== "loading" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                      webinarStatus === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                    }`}
                  >
                    {webinarStatus === "success" ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                    {webinarMsg}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={webinarStatus === "loading"}
                  className="w-full h-11 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity"
                >
                  {webinarStatus === "loading" ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><Radio className="mr-2 h-4 w-4" /> Save Webinar</>  
                  )}
                </Button>
              </form>
            </div>

            {/* ── Registered Candidates ── */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-electric-light" />
                Registered Candidates
                <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-electric/10 text-electric-light border border-electric/20">
                  {webinarRegs.length}
                </span>
              </h2>

              {webinarRegs.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No registrations yet. Share the webinar link to get signups!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> Full Name</span>
                        </th>
                        <th className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</span>
                        </th>
                        <th className="text-left py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Registered</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {webinarRegs.map((reg, i) => (
                        <motion.tr
                          key={reg.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                        >
                          <td className="py-3 pr-4 text-slate-200 font-medium">{reg.full_name}</td>
                          <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{reg.email}</td>
                          <td className="py-3 text-slate-600 text-xs">
                            {new Date(reg.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════ TAB 5: NOTIFICATIONS ════════════════════════ */}
        {activeTab === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Bell className="h-6 w-6 text-electric-light" />
                Send Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Broadcast messages to a specific course or send direct notifications to students.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 max-w-2xl">
              <form onSubmit={handleSendNotification} className="space-y-5">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="notifMode"
                      value="broadcast"
                      checked={notifMode === "broadcast"}
                      onChange={() => setNotifMode("broadcast")}
                      className="accent-electric"
                    />
                    Broadcast to Course
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="notifMode"
                      value="direct"
                      checked={notifMode === "direct"}
                      onChange={() => setNotifMode("direct")}
                      className="accent-electric"
                    />
                    Direct to Student
                  </label>
                </div>

                {notifMode === "broadcast" ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Select Course</label>
                    <select
                      value={notifCourseId}
                      onChange={(e) => setNotifCourseId(e.target.value)}
                      required
                      className="w-full h-11 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-electric/50 rounded-xl px-3"
                    >
                      <option value="" className="bg-navy text-slate-400">Choose a course...</option>
                      {publishedCourses.map((c) => (
                        <option key={c.id} value={c.id} className="bg-navy">{c.title}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-500" /> Student Email
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="student@example.com"
                      value={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.value)}
                      className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Notification Title</label>
                  <Input
                    required
                    placeholder="e.g. New Assignment Posted"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Message</label>
                  <textarea
                    required
                    placeholder="Enter the notification message..."
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-electric/50 transition-colors placeholder:text-white/40 resize-none"
                  />
                </div>

                {notifStatus !== "idle" && notifStatus !== "loading" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                      notifStatus === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                    }`}
                  >
                    {notifStatus === "success" ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                    {notifMsg}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={notifStatus === "loading"}
                  className="w-full h-11 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity"
                >
                  {notifStatus === "loading" ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><Bell className="mr-2 h-4 w-4" /> Send Notification</>  
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ════════════════════ TAB 6: COLLABORATIONS & PRESS ═══════════════ */}
        {activeTab === "collabs" && (
          <motion.div key="collabs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Handshake className="h-6 w-6 text-electric-light" />
                Manage Collaborations & Press
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Manage carousel images, brand partners, and press coverage for the Collaborations page.
              </p>
            </div>

            {/* Status toast */}
            {collabStatus !== "idle" && collabStatus !== "loading" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                  collabStatus === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                }`}
              >
                {collabStatus === "success" ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                {collabMsg}
              </motion.div>
            )}

            {/* ── 1. Carousel Manager ─────────────────────────────────────── */}
            <div className="glass-card rounded-2xl p-8 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-400" />
                Carousel Images
                <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {carouselImages.length}
                </span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Image URL (e.g. https://...)"
                  value={carouselUrl}
                  onChange={(e) => setCarouselUrl(e.target.value)}
                  className="flex-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                />
                <select
                  value={carouselOrientation}
                  onChange={(e) => setCarouselOrientation(e.target.value as "landscape" | "portrait")}
                  className="h-11 rounded-xl bg-white/5 border border-white/10 text-white px-3 text-sm focus:outline-none focus:border-electric/50"
                >
                  <option value="landscape" className="bg-slate-900">Landscape</option>
                  <option value="portrait" className="bg-slate-900">Portrait</option>
                </select>
                <Button
                  type="button"
                  onClick={handleAddCarouselImage}
                  disabled={collabStatus === "loading" || !carouselUrl.trim()}
                  className="h-11 px-6 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Image
                </Button>
              </div>

              {carouselImages.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No carousel images yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {carouselImages.map((img) => (
                    <div key={img.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate font-mono">{img.image_url}</p>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{img.orientation}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCarouselImage(img.id)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 2. Brand Partners Manager ────────────────────────────────── */}
            <div className="glass-card rounded-2xl p-8 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-cyan-400" />
                Brand Partners
                <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {brandPartners.length}
                </span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Brand name (e.g. Google)"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="flex-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                />
                <Input
                  placeholder="https://apple.com"
                  value={brandLink}
                  onChange={(e) => setBrandLink(e.target.value)}
                  className="flex-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                />
                <Button
                  type="button"
                  onClick={handleAddBrand}
                  disabled={collabStatus === "loading" || !brandName.trim() || !brandLink.trim()}
                  className="h-11 px-6 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Brand
                </Button>
              </div>

              {brandPartners.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No brand partners yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {brandPartners.map((bp) => (
                    <div key={bp.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{bp.name}</p>
                        <a href={bp.website_link} target="_blank" rel="noopener noreferrer" className="text-xs text-electric-light hover:underline flex items-center gap-1 mt-0.5">
                          {bp.website_link} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <button
                        onClick={() => handleDeleteBrand(bp.id)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 3. Press Articles Manager ────────────────────────────────── */}
            <div className="glass-card rounded-2xl p-8 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-amber-400" />
                Press Articles
                <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {pressArticles.length}
                </span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Publisher name (e.g. TechCrunch)"
                  value={pressPublisher}
                  onChange={(e) => setPressPublisher(e.target.value)}
                  className="flex-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                />
                <Input
                  placeholder="https://techcrunch.com/article-url"
                  value={pressLink}
                  onChange={(e) => setPressLink(e.target.value)}
                  className="flex-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-electric/50 rounded-xl"
                />
                <Button
                  type="button"
                  onClick={handleAddPress}
                  disabled={collabStatus === "loading" || !pressPublisher.trim() || !pressLink.trim()}
                  className="h-11 px-6 gradient-electric text-white font-semibold rounded-xl glow-blue hover:opacity-90 transition-opacity shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Press
                </Button>
              </div>

              {pressArticles.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No press articles yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {pressArticles.map((pa) => (
                    <div key={pa.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{pa.publisher_name}</p>
                        <a href={pa.article_link} target="_blank" rel="noopener noreferrer" className="text-xs text-electric-light hover:underline flex items-center gap-1 mt-0.5">
                          {pa.article_link} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <button
                        onClick={() => handleDeletePress(pa.id)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
