"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (!mounted || isLoading) {
    return (
      <div className="landing-loading">
        <div className="landing-loading-orb" />
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Background Effects */}
      <div className="landing-bg">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
        <div className="landing-grid" />
      </div>

      {/* Main Content */}
      <div className="landing-content">
        {/* Hero Section */}
        <section className="landing-hero">
          {/* Microphone Icon with Glow */}
          <div className="landing-mic-container animate-fade-in">
            <div className="landing-mic-rings">
              <div className="landing-mic-ring landing-mic-ring-1" />
              <div className="landing-mic-ring landing-mic-ring-2" />
              <div className="landing-mic-ring landing-mic-ring-3" />
            </div>
            <div className="landing-mic-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
          </div>

          {/* Badge */}
          <div
            className="landing-badge animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="landing-badge-dot" />
            AI Voice Companion
          </div>

          {/* Heading */}
          <h1
            className="landing-title animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            Your Thoughts,
            <br />
            <span className="glow-text">Understood.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="landing-subtitle animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Luma is your AI-powered companion for reflection, problem-solving,
            and personal growth. Talk, type, or journal — Luma listens and
            responds thoughtfully.
          </p>

          {/* CTA Buttons */}
          <div
            className="landing-cta animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <Link href="/register" className="btn-primary landing-btn-create">
              Create Account
            </Link>
            <Link href="/login" className="btn-secondary landing-btn-login">
              Log In
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="landing-features stagger-children">
          <div className="landing-feature glass-card">
            <div className="landing-feature-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Talk &amp; Reflect</h3>
            <p>Express your thoughts in a calm, supportive space</p>
          </div>

          <div className="landing-feature glass-card">
            <div className="landing-feature-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h3>Problem Solver</h3>
            <p>Break down challenges and find practical next steps</p>
          </div>

          <div className="landing-feature glass-card">
            <div className="landing-feature-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>Goal Planner</h3>
            <p>Define goals, organize tasks, and create action plans</p>
          </div>
        </section>

        {/* Footer note */}
        <p className="landing-disclaimer animate-fade-in" style={{ animationDelay: "0.8s" }}>
          Luma is an AI companion, not a replacement for professional care.
          <br />
          All data stays on your device.
        </p>
      </div>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ─── Background ─────────────────────── */
        .landing-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .landing-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .landing-orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
          top: -150px;
          left: -100px;
          animation: float 8s ease-in-out infinite;
        }

        .landing-orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          bottom: -100px;
          right: -80px;
          animation: float 10s ease-in-out infinite reverse;
        }

        .landing-orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #6d28d9 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: float 12s ease-in-out infinite;
          opacity: 0.2;
        }

        .landing-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
              rgba(168, 85, 247, 0.03) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(168, 85, 247, 0.03) 1px,
              transparent 1px
            );
          background-size: 60px 60px;
        }

        /* ─── Content ────────────────────────── */
        .landing-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          width: 100%;
          padding: 40px 24px;
          text-align: center;
        }

        .landing-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          margin-bottom: 60px;
        }

        /* ─── Mic Icon ───────────────────────── */
        .landing-mic-container {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .landing-mic-rings {
          position: absolute;
          inset: 0;
        }

        .landing-mic-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(168, 85, 247, 0.2);
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .landing-mic-ring-1 {
          inset: 0;
          animation-delay: 0s;
        }

        .landing-mic-ring-2 {
          inset: -15px;
          opacity: 0.6;
          animation-delay: 0.5s;
        }

        .landing-mic-ring-3 {
          inset: -30px;
          opacity: 0.3;
          animation-delay: 1s;
        }

        .landing-mic-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.4),
            rgba(168, 85, 247, 0.2)
          );
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-light);
          border: 1px solid rgba(168, 85, 247, 0.3);
          box-shadow: 0 0 40px rgba(168, 85, 247, 0.25),
            inset 0 0 20px rgba(168, 85, 247, 0.1);
          animation: pulse-glow 3s ease-in-out infinite;
        }

        /* ─── Badge ──────────────────────────── */
        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          color: var(--text-secondary);
          backdrop-filter: blur(8px);
        }

        .landing-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-primary);
          box-shadow: 0 0 8px var(--accent-glow);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* ─── Typography ─────────────────────── */
        .landing-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .landing-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.15rem);
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 550px;
        }

        /* ─── CTA ────────────────────────────── */
        .landing-cta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .landing-btn-create,
        .landing-btn-login {
          min-width: 200px;
          text-decoration: none;
          text-align: center;
        }

        /* ─── Features ───────────────────────── */
        .landing-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .landing-feature {
          padding: 28px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .landing-feature-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.2),
            rgba(168, 85, 247, 0.1)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-light);
          border: 1px solid rgba(168, 85, 247, 0.15);
        }

        .landing-feature h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .landing-feature p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* ─── Disclaimer ─────────────────────── */
        .landing-disclaimer {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* ─── Loading ────────────────────────── */
        .landing-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
        }

        .landing-loading-orb {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            var(--accent-secondary),
            var(--accent-primary)
          );
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        /* ─── Mobile ─────────────────────────── */
        @media (max-width: 640px) {
          .landing-mic-container {
            width: 120px;
            height: 120px;
          }

          .landing-mic-icon {
            width: 80px;
            height: 80px;
          }

          .landing-mic-icon svg {
            width: 36px;
            height: 36px;
          }

          .landing-cta {
            flex-direction: column;
            width: 100%;
            padding: 0 20px;
          }

          .landing-btn-create,
          .landing-btn-login {
            width: 100%;
          }

          .landing-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
