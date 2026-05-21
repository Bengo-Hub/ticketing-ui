"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/base";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage ticketing configuration
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <Settings className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Settings coming soon.</p>
          <p className="text-sm text-muted-foreground mt-1">
            SLA policies, categories, and notification settings will be configurable here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
