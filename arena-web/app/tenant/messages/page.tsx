"use client";

import MessagesInbox from "@/components/communication/MessagesInbox";

export default function TenantMessagesPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto pb-24">
      <MessagesInbox title="Messages" className="text-gray-900 dark:text-white" />
    </div>
  );
}
