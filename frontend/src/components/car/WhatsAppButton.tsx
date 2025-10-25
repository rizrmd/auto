/**
 * WhatsAppButton - Sticky premium WhatsApp CTA button
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useTenantContext } from '../../context/TenantContext';
import type { Car } from '../../api/cars';

interface WhatsAppButtonProps {
  car?: Car;
  message?: string;
  className?: string;
  sticky?: boolean;
}

export function WhatsAppButton({
  car,
  message,
  className,
  sticky = true,
}: WhatsAppButtonProps) {
  const { tenant } = useTenantContext();

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  // Generate WhatsApp message
  let whatsappMessage = message;
  
  if (!whatsappMessage && car) {
    whatsappMessage = `Halo, saya tertarik dengan mobil ${car.publicName}

Detail:
- Tahun: ${car.year}
- Warna: ${car.color}
- Transmisi: ${car.transmission}
- KM: ${car.km.toLocaleString('id-ID')} km
- Harga: ${formatPrice(car.price)}
- Kode: ${car.displayCode}

Apakah masih tersedia?`;
  }

  if (!whatsappMessage) {
    whatsappMessage = 'Halo, saya tertarik dengan mobil yang Anda jual.';
  }

  const encodedMessage = encodeURIComponent(whatsappMessage);
  const phoneNumber = tenant?.whatsappNumber?.replace(/[^0-9]/g, '') || '';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (sticky) {
    return (
      <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
        <Button
          asChild
          size="lg"
          className={cn(
            'w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto',
            'bg-[#25D366] hover:bg-[#20BA5A] text-white',
            'animate-in fade-in zoom-in-95 duration-300',
            'flex items-center justify-center p-0',
            className
          )}
          aria-label="Hubungi via WhatsApp"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
            <MessageCircle className="h-6 w-6" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Button
      asChild
      size="lg"
      className={cn(
        'w-full shadow-md hover:shadow-lg transition-all duration-300',
        'bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold',
        className
      )}
    >
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        <MessageCircle className="h-5 w-5 mr-2" />
        Hubungi via WhatsApp
      </a>
    </Button>
  );
}