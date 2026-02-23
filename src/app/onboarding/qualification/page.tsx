"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function QualificationPage() {
  const router = useRouter();
  const [eduEmail, setEduEmail] = useState("");
  const [otherProof, setOtherProof] = useState("");
  const [verifyMode, setVerifyMode] = useState<"edu" | "other">("edu");

  const eduMutation = trpc.qualification.verifyEduEmail.useMutation({
    onSuccess: (data) => {
      if (data.eduVerified) {
        router.push("/onboarding/survey");
      }
    },
  });

  const otherMutation = trpc.qualification.upsert.useMutation({
    onSuccess: () => router.push("/onboarding/survey"),
  });

  function handleEduSubmit(e: React.FormEvent) {
    e.preventDefault();
    eduMutation.mutate({ eduEmail });
  }

  function handleOtherSubmit(e: React.FormEvent) {
    e.preventDefault();
    otherMutation.mutate({ otherProof });
  }

  const isEduEmail = eduEmail.endsWith(".edu") || eduEmail.endsWith(".edu.cn");

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-serif mb-2">Verify your identity</h1>
      <p className="text-muted-foreground mb-8">
        Help us build a trustworthy community. Choose a verification method below.
      </p>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setVerifyMode("edu")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            verifyMode === "edu"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-border"
          }`}
        >
          .edu Email
        </button>
        <button
          onClick={() => setVerifyMode("other")}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            verifyMode === "other"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-border"
          }`}
        >
          Other Proof
        </button>
      </div>

      {verifyMode === "edu" ? (
        <form onSubmit={handleEduSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              University Email (.edu)
            </label>
            <input
              type="email"
              value={eduEmail}
              onChange={(e) => setEduEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {eduEmail && !isEduEmail && (
              <p className="text-sm text-muted-foreground mt-2">
                This doesn&apos;t look like a .edu email. You can still submit, but you may need additional verification.
              </p>
            )}
            {eduEmail && isEduEmail && (
              <p className="text-sm text-green-600 mt-2">
                Looks like a valid .edu email!
              </p>
            )}
          </div>

          {eduMutation.data && !eduMutation.data.eduVerified && (
            <div className="bg-muted rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                Your email doesn&apos;t appear to be a .edu address. Please try again or use the &quot;Other Proof&quot; option.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={eduMutation.isPending || !eduEmail}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {eduMutation.isPending ? "Verifying..." : "Verify Email"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtherSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe your qualification
            </label>
            <textarea
              value={otherProof}
              onChange={(e) => setOtherProof(e.target.value)}
              placeholder="Tell us about your education, profession, or other credentials..."
              required
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {otherProof.length}/1000 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={otherMutation.isPending || !otherProof}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {otherMutation.isPending ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      )}

      <button
        onClick={() => router.push("/onboarding/survey")}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
