"use client";

import AdminTopBar from "@/components/admin/AdminTopBar";
import MessagesInbox from "@/components/communication/MessagesInbox";

export default function AdminMessagesPage() {
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <AdminTopBar />
      <div className="p-4 md:p-6 lg:p-8">
        <MessagesInbox title="Messages" />
      </div>
    </div>
  );
}
