"use client";

import { Suspense } from "react";
import { CreateTicketForm } from "@/components/support/create-ticket-form";

/** Public support form: /support?org=<slug> (`tenant` also accepted). The flow lives in CreateTicketForm. */
export default function SupportPage() {
  return (
    <Suspense fallback={null}>
      <CreateTicketForm />
    </Suspense>
  );
}
