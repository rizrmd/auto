/**
 * WhatsAppButton - Sticky premium WhatsApp CTA button
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
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

  const handleClick = () => {
    if (!tenant?.whatsappNumber) {
      console.error('WhatsApp number not configured');
      return;
    }

    let whatsappMessage = message;

    if (!whatsappMessage && car) {
      const formatPrice = (price: string | number) => {
        const numPrice = typeof price === 'string' ? parseInt(price) : price;
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(numPrice);
      };

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
    const phoneNumber = tenant.whatsappNumber.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (sticky) {
    return (
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-40">
        <Button
          onClick={handleClick}
          size="lg"
          className={cn(
            'w-full max-w-md mx-auto shadow-xl hover:shadow-2xl transition-all duration-300 pointer-events-auto',
            'bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold',
            'animate-in slide-in-from-bottom-5 duration-500',
            className
          )}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Chat via WhatsApp
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={cn(
        'w-full shadow-md hover:shadow-lg transition-all duration-300',
        'bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold',
        className
      )}
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      Chat via WhatsApp
    </Button>
  );
}
