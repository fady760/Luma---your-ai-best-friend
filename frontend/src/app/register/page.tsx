"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register, error, clearError, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    // Client-side validation
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username, email, password);
      router.push("/dashboard");
    } catch {
      // Error is already set in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page">
      {/* Background Effects */}
      <div className="landing-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-container animate-fade-in">
        {/* Logo / Back Link */}
        <Link href="/" className="auth-logo">
          <div className="auth-logo-icon">
            <svg
              width="24"
              height="24"
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
          <span>Luma</span>
        </Link>

        {/* Form Card */}
        <div className="auth-card glass-card-static">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">
            Start your journey with Luma
          </p>

          {displayError && (
            <div className="auth-error" role="alert">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="register-username" className="input-label">
                Username
              </label>
              <input
                id="register-username"
                type="text"
                className="input-field"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email" className="input-label">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password" className="input-label">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                className="input-field"
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm" className="input-label">
                Confirm Password
              </label>
              <input
                id="register-confirm"
                type="password"
                className="input-field"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting ? (
                <span className="auth-spinner" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link href="/login" className="auth-link">
              Log in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          pointer-events: none;
        }

        .auth-orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
          top: -100px;
          right: -100px;
        }

        .auth-orb-2 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          bottom: -80px;
          left: -80px;
        }

        .auth-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text-primary);
          font-size: 1.25rem;
          font-weight: 700;
        }

        .auth-logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.3),
            rgba(168, 85, 247, 0.15)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-light);
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        .auth-card {
          width: 100%;
          padding: 36px 32px;
        }

        .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .auth-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 24px;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: 0.875rem;
          margin-bottom: 20px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
        }

        .auth-submit {
          width: 100%;
          margin-top: 8px;
          height: 48px;
        }

        .auth-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .auth-link {
          color: var(--accent-light);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .auth-link:hover {
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
