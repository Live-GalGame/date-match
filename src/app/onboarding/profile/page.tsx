"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"];
const classYearOptions = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "PhD"];

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    gender: "",
    age: 20,
    school: "",
    major: "",
    classYear: "",
    bio: "",
  });

  const mutation = trpc.profile.upsert.useMutation({
    onSuccess: () => router.push("/onboarding/qualification"),
  });

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      displayName: form.displayName,
      gender: form.gender,
      age: form.age,
      school: form.school,
      major: form.major || undefined,
      classYear: form.classYear || undefined,
      bio: form.bio || undefined,
    });
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-serif mb-2">Tell us about yourself</h1>
      <p className="text-muted-foreground mb-8">
        This information helps us find better matches for you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            placeholder="How should we call you?"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => update("gender", g)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  form.gender === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-border"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Age</label>
          <input
            type="number"
            min={18}
            max={100}
            value={form.age}
            onChange={(e) => update("age", parseInt(e.target.value))}
            required
            className="w-24 px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">School / University</label>
          <input
            type="text"
            value={form.school}
            onChange={(e) => update("school", e.target.value)}
            placeholder="e.g., Stanford University"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Major (optional)</label>
            <input
              type="text"
              value={form.major}
              onChange={(e) => update("major", e.target.value)}
              placeholder="e.g., Computer Science"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Class Year (optional)</label>
            <div className="flex flex-wrap gap-1.5">
              {classYearOptions.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => update("classYear", y)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.classYear === y
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bio (optional)</label>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Tell us a bit about yourself..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {form.bio.length}/500 characters
          </p>
        </div>

        {mutation.error && (
          <p className="text-destructive text-sm">
            Something went wrong. Please try again.
          </p>
        )}

        <button
          type="submit"
          disabled={
            mutation.isPending || !form.displayName || !form.gender || !form.school
          }
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
