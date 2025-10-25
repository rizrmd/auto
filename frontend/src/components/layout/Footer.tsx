/**
 * Footer - Premium site footer with contact info
 */

import React from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { useTenantContext } from "../../context/TenantContext";
import { cn } from "../../lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const { tenant } = useTenantContext();

  const formatBusinessHours = (hours: Record<string, string> | null) => {
    if (!hours) return null;

    const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const dayNames = [
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
      "Minggu",
    ];

    return days
      .map((day, index) => {
        const time = hours[day];
        if (!time) return null;

        return (
          <div key={day} className="text-sm text-muted-foreground">
            <span className="inline-block w-24">{dayNames[index]}</span>
            <span className="font-medium">{time}</span>
          </div>
        );
      })
      .filter(Boolean);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("bg-muted/30 border-t mt-auto", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p className="font-medium mb-2 md:mb-0">
            © {currentYear} {tenant?.name || "AutoLeads"}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span>
              Powered by{" "}
              <a
                href="https://lumiku.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Lumiku AutoLeads
              </a>
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Trusted by thousands</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
