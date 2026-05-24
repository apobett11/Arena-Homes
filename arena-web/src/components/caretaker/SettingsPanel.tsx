"use client";

import React from "react";
import { User, MapPin, Home, Mail, Phone, LogOut, ShieldCheck, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";
import type { CaretakerDashboardData, CaretakerProperty } from "@/lib/caretaker/types";
import { cn, ck } from "./caretaker-ui";

interface SettingsPanelProps {
  caretaker: CaretakerDashboardData;
  property: CaretakerProperty | null;
}

export const SettingsPanel = ({ caretaker, property }: SettingsPanelProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    await AuthApi.logout();
    localStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role");
    router.replace("/");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className={ck.card}>
        <h3 className={cn(ck.headline, "mb-4")}>Caretaker profile</h3>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary-container/20 flex items-center justify-center border-2 border-primary-container">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <p className="font-semibold text-arena-on-surface text-lg">
              {caretaker.caretaker_full_name || "Caretaker"}
            </p>
            <span className="caretaker-chip bg-primary-container/20 text-primary">CARETAKER</span>
            {caretaker.caretaker_email && (
              <p className={cn(ck.body, "flex items-center gap-2")}>
                <Mail className="w-4 h-4" />
                {caretaker.caretaker_email}
              </p>
            )}
            {caretaker.caretaker_phone_number && (
              <p className={cn(ck.body, "flex items-center gap-2")}>
                <Phone className="w-4 h-4" />
                {caretaker.caretaker_phone_number}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={ck.card}>
        <h3 className={cn(ck.headline, "mb-4")}>Assigned property</h3>
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-medium text-arena-on-surface">
            <Home className="w-4 h-4 text-primary" />
            {property?.name || caretaker.property_name || "Unassigned"}
          </p>
          <p className={cn(ck.body, "flex items-center gap-2")}>
            <MapPin className="w-4 h-4" />
            {property?.location || caretaker.property_location || "No location set"}
          </p>
          <div className="flex items-center gap-2 text-sm text-primary">
            <ShieldCheck className="w-4 h-4" />
            Verified property access
          </div>
        </div>
      </div>

      <div className={ck.card}>
        <h3 className={cn(ck.headline, "mb-2")}>Account actions</h3>
        <p className={cn(ck.body, "mb-4")}>
          Sign out ends your caretaker session. You will need to log in again to access the console.
        </p>
        <button type="button" onClick={handleLogout} className={ck.btnDanger}>
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      <div className={cn(ck.card, "flex items-start gap-3 bg-arena-surface-container-low")}>
        <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className={ck.body}>
          Notification preferences are managed through your account profile. Contact admin for role or property assignment changes.
        </p>
      </div>
    </div>
  );
};
