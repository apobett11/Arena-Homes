"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, LogOut, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";
import {
  getCaretakerProfile,
  updateCaretakerProfile,
  type CaretakerProfileRecord,
} from "@/lib/caretaker/dashboard";
import { cn, ck } from "@/components/caretaker/caretaker-ui";

export default function CaretakerProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<CaretakerProfileRecord | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await getCaretakerProfile();
    if (!data) {
      setError("Could not load profile.");
      setLoading(false);
      return;
    }
    setProfile(data);
    setEmail(data.email || "");
    setPhone(data.phone_number || "");
    setAvatarUrl(data.avatar_url || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await updateCaretakerProfile({
      email: email.trim(),
      phone_number: phone.trim(),
      avatar_url: avatarUrl.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      setFeedback("Profile updated successfully.");
      await loadProfile();
    } else {
      setFeedback(result.error || "Could not update profile.");
    }
  };

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFeedback("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      setFeedback("Image ready — save profile to apply (data URL). For production CDN URLs, paste a hosted link.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await AuthApi.logout();
    localStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role");
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#0d3b66]/20 border-t-[#0d3b66]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={cn(ck.page, "flex min-h-[50vh] items-center justify-center")}>
        <p className="font-semibold text-red-700">{error || "Profile unavailable"}</p>
      </div>
    );
  }

  return (
    <div className={cn(ck.page, "max-w-2xl pb-8")}>
      <header className="mb-6">
        <p className={ck.sectionTitle}>Account</p>
        <h1 className="caretaker-display-lg text-[#0a2540]">Caretaker profile</h1>
        <p className={cn(ck.body, "mt-2")}>Update contact details and profile photo. Changes sync to your profile record.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <div className={ck.card}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a2540] to-[#1a4d7a] ring-2 ring-[#0d3b66]/20"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="m-auto h-12 w-12 text-white" />
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 py-1 text-[10px] font-bold text-white">
                <Camera className="h-3 w-3" />
                Change
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarFile(f);
              }}
            />
            <div className="flex-1 w-full space-y-3">
              <p className="font-bold text-lg text-[#0f1c2e]">{profile.full_name || "Caretaker"}</p>
              <div>
                <label className={ck.fieldLabel}>Avatar URL (optional hosted image)</label>
                <input
                  className={ck.input}
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className={ck.card}>
          <div className="space-y-4">
            <div>
              <label className={cn(ck.fieldLabel, "flex items-center gap-2")}>
                <Mail className="h-4 w-4" />
                Email
              </label>
              <input
                type="email"
                className={ck.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={cn(ck.fieldLabel, "flex items-center gap-2")}>
                <Phone className="h-4 w-4" />
                Phone number
              </label>
              <input
                type="tel"
                className={ck.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {feedback && (
          <p
            className={cn(
              "text-sm font-semibold",
              feedback.includes("success") ? "text-emerald-700" : "text-amber-800"
            )}
          >
            {feedback}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className={ck.btnPrimary}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          <button type="button" onClick={handleLogout} className={ck.btnDanger}>
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </form>
    </div>
  );
}
