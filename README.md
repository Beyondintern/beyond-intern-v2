# Beyond Intern | The Premium EdTech Platform

Beyond Intern is an enterprise-grade, full-stack educational platform engineered to bridge the gap between academic learning and industry demands. Built with a focus on high performance, modern aesthetic (glassmorphism), and AI-driven user engagement, the platform delivers a seamless experience from course discovery to checkout and learning.

##  The Competitive Edge: Why This Architecture Excels

Unlike legacy LMS platforms (like WordPress/LearnDash or basic React apps), Beyond Intern is built on a modern, edge-ready architecture:
* **Blazing Fast Performance:** Utilizing Next.js 16 App Router and React Server Components (RSC) to ship zero-client-side JavaScript where possible, resulting in near-instant page loads and perfect Core Web Vitals.
* **Intelligent AI Integration:** Features a custom-built, streaming AI Advisor powered by Google's Gemini 2.0 Flash model, integrated directly into the UI without feeling like a generic "wrapper."
* **Enterprise-Grade Security:** Session management via NextAuth (OAuth & Magic Links), with server-side admin authorization enforced on every privileged action.
* **High-Converting UI/UX:** Heavily optimized user flows, premium Tailwind CSS styling, translucent glassmorphism interfaces, and dynamic data pagination for frictionless browsing.

##  Tech Stack

**Frontend & Core Framework:**
* **Next.js 16** (App Router, Server Actions, Turbopack)
* **React** (Hooks, Suspense, Concurrent Features)
* **Tailwind CSS** (Custom theme, complex gradients, Backdrop Blur utilities)
* **Framer Motion / Tailwind Animate** (Fluid transitions and component reveals)

**Backend & Infrastructure:**
* **Supabase (PostgreSQL):** Relational database with Row Level Security (RLS).
* **NextAuth.js:** Secure authentication (Google OAuth + email/password credentials verified against Supabase Auth).
* **Stripe API:** PCI-compliant checkout processing and secure webhook listeners.
* **Vercel:** Edge network deployment and CI/CD pipeline.
* **Google Generative AI SDK:** Streaming LLM integration (Gemini 2.0 Flash).

##  Core Features & Components

* **AI Learning Advisor (`@chatbot.tsx`):** A floating, context-aware AI assistant that guides users toward the right career tracks, utilizing streaming server responses for zero-latency communication.
* **Dynamic Course Engine (`@course-grid.tsx`):** A responsive, paginated grid rendering high-fidelity course cards with dynamic pricing, categorization, and Unsplash API image handling.
* **Secure Checkout Flow (`@checkout/page.tsx`):** Server-side price validation preventing client-side manipulation, seamlessly handing off to Stripe Checkout.
* **Student Dashboard (`@dashboard/page.tsx`):** A personalized, authenticated hub tracking active courses, learning streaks, and gamified achievement badges.
* **Live Webinar System (`@webinar/page.tsx`):** Time-aware event scheduling with conditional logic for "Live", "Soon", and "Past" states, integrated with lead-capture forms.

##  Database Schema (Overview)

The platform relies on a normalized PostgreSQL database designed for scale. Key tables include:
* `auth.users`: Supabase-managed accounts (password + OAuth), surfaced to the app via the admin API.
* `raw_courses`: Course catalog — curriculum, pricing, duration, categorization, video modules.
* `user_courses`: Enrollment junction (`user_email`, `course_id`) granted by admin assignment.
* `user_purchases`: Stripe purchase receipts (`user_id`, `course_id`, `stripe_session_id`) written by the verified webhook.
* `webinars` / `webinar_registrations`: Active webinar state and lead capture.
* `notifications`: Broadcast and direct messages filtered per-user server-side.

## \ Future Scope & Roadmap

As the platform scales, the architecture is primed for the following expansions:
1. **Proprietary Video Hosting:** Integrating an HLS video streaming provider (like Mux or AWS MediaLive) for DRM-protected course consumption directly within the dashboard.
2. **B2B Team Portals:** Building a separate tenant for enterprise clients to buy bulk seats and track employee learning metrics.
3. **Advanced AI Tutoring:** Expanding the Gemini integration to read specific course transcripts and provide context-aware homework help to enrolled students.
4. **React Native Mobile App:** Leveraging the existing Next.js API routes to power a native iOS/Android application.

---
*Developed and maintained by divyant06 aka Anshu ( www.linkedin.com/in/divyant-poddar-4b6672313 ) For inquiries, contact info@beyondintern.com*
