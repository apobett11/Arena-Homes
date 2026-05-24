"use client";

import MessagesInbox from "@/components/communication/MessagesInbox";
import { ck } from "@/components/caretaker/caretaker-ui";

export default function CaretakerMessagesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="caretaker-display-lg text-arena-on-surface">Messages</h1>
        <p className={ck.body}>Tenant, admin, and system conversations for your assigned property.</p>
      </div>
      <div className="caretaker-card p-4 md:p-6">
        <MessagesInbox title="Inbox" className="text-arena-on-surface" />
      </div>
    </div>
  );
}
