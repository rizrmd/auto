/**
 * Footer - Premium site footer with contact info
 */

import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useTenantContext } from '../../context/TenantContext';
import { cn } from '../../lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const { tenant } = useTenantContext();

  const formatBusinessHours = (hours: Record<string, string> | null) => {
    if (!hours) return null;

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    return days.map((day, index) => {
      const time = hours[day];
      if (!time) return null;

      return (
        <div key={day} className="text-sm text-muted-foreground">
          <span className="inline-block w-24">{dayNames[index]}</span>
          <span className="font-medium">{time}</span>
        </div>
      );
    }).filter(Boolean);
  };

  const currentYear = new Date().getFullYear();

  return (
<footer className={cn('bg-muted/30 border-t mt-auto', className)}>
  <div className="container mx-auto px-4 py-12">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {/* About */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          {tenant?.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: tenant?.primaryColor || '#FF5722' }}
            >
              {tenant?.name?.[0] || 'A'}
            </div>
          )}
          <span className="font-bold text-lg">{tenant?.name || 'AutoLeads'}</span>
        </div>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-semibold mb-4">Hubungi Kami</h3>
        <div className="space-y-3">
          {tenant?.phone && (
            <a
              href={`tel:${tenant.phone}`}
              className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{tenant.phone}</span>
            </a>
          )}
          {tenant?.whatsappNumber && (
            <a
              href={`https://wa.me/${tenant.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>WhatsApp</span>
            </a>
          )}
          {tenant?.email && (
            <a
              href={`mailto:${tenant.email}`}
              className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{tenant.email}</span>
            </a>
          )}
        </div>
      </div>

      {/* Location */}
      {tenant?.address && (
        <div>
          <h3 className="font-semibold mb-4">Lokasi</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>{tenant.address}</p>
                {tenant.city && <p>{tenant.city}</p>
              </div>
            </div>
            {tenant.mapsUrl && (
              <a
                href={tenant.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-primary hover:underline font-medium"
              >
                Lihat di Maps
              </a>
            )}
          </div>
        </div>
      )}

      {/* Business Hours */}
      {tenant?.businessHours && (
        <div>
          <h3 className="font-semibold mb-4">Jam Operasional</h3>
          <div className="space-y-1">
            <div className="flex items-start gap-2 mb-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                {formatBusinessHours(tenant.businessHours as Record<string, string>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Bottom Bar - Single Clean Row */}
    <div className="mt-12 pt-8 border-t">
      <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
        <p className="font-medium mb-2 md:mb-0">
          © {currentYear} {tenant?.name || 'AutoLeads'}. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span>
            Powered by{' '}
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
  </div>
</footer>
  );
}
