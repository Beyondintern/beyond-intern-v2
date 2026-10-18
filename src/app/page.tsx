import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { VideoCarousel } from "@/components/landing/video-carousel";
import { CourseGrid } from "@/components/landing/course-grid";
import { WebinarSection } from "@/components/landing/webinar-section";
import { InternshipSection } from "@/components/landing/internship-section";
import { Testimonials } from "@/components/landing/testimonials";
import { Newsletter } from "@/components/landing/newsletter";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <VideoCarousel />
        <CourseGrid />
        <WebinarSection />
        <InternshipSection />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
