import { redirect } from "next/navigation";

const TAB_REDIRECTS: Record<string, string> = {
  units: "/caretaker/units",
  tenants: "/caretaker/tenants",
  issues: "/caretaker/issues",
  repairs: "/caretaker/repairs",
  applications: "/caretaker/applications",
  announcements: "/caretaker/announcements",
  rules: "/caretaker/dashboard",
  leases: "/caretaker/tenants",
  photos: "/caretaker/photos",
  facilities: "/caretaker/dashboard",
  settings: "/caretaker/profile",
};

export default async function LegacyCaretakerDashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab && TAB_REDIRECTS[tab]) {
    redirect(TAB_REDIRECTS[tab]);
  }
  redirect("/caretaker/dashboard");
}
