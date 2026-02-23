"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authClient.signIn.magicLink({ email, callbackURL: "/onboarding/profile" });
      setSent(true);
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="text-5xl mb-6">✉️</div>
          <h1 className="text-3xl font-serif text-primary mb-4">Check your email</h1>
          <p className="text-muted-foreground text-lg mb-2">
            We sent a magic link to
          </p>
          <p className="text-foreground font-medium text-lg mb-8">{email}</p>
          <p className="text-muted-foreground text-sm">
            Click the link in the email to sign in. The link expires in 5 minutes.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-8 text-primary underline underline-offset-4 text-sm hover:text-accent transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-serif text-primary hover:text-accent transition-colors">
            date match.
          </Link>
          <h1 className="text-2xl font-serif mt-6 mb-2">Welcome</h1>
          <p className="text-muted-foreground">
            Enter your email to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Continue with Email"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          We&apos;ll send you a magic link to sign in — no password needed.
        </p>
      </div>
    </div>
  );
}
