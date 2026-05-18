"use client";

import MessagesInbox from "@/components/communication/MessagesInbox";

export default function CaretakerMessagesPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <MessagesInbox title="Messages" className="text-slate-900 dark:text-white" />
    </div>
  );
}
