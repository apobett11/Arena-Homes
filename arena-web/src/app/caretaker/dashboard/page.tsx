import { redirect } from "next/navigation";

export default async function LegacyCaretakerDashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  if (tab) {
    redirect(`/caretaker/dashboard?tab=${tab}`);
  }
  redirect("/caretaker/dashboard");
}
