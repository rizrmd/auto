/**
 * CarCard - Premium car thumbnail card
 */

import React from 'react';
import { MapPin, Gauge, Calendar, Fuel, Cog } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import type { Car } from '../../api/cars';

interface CarCardProps {
  car: Car;
  onClick?: () => void;
  className?: string;
}

export function CarCard({ car, onClick, className }: CarCardProps) {
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const primaryPhoto = car.photos[car.primaryPhotoIndex] || car.photos[0];

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden border shadow-md hover:shadow-2xl transition-all duration-500 bg-card',
        'hover:-translate-y-1 hover:border-primary/20',
        onClick && 'active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={car.publicName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Fuel className="h-12 w-12 text-muted-foreground opacity-50" />
          </div>
        )}

        {/* Premium Glass Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Status Badge */}
        {car.status === 'sold' && (
          <div className="absolute top-3 left-3 bg-destructive text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            SOLD OUT
          </div>
        )}
        {car.status === 'booking' && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            RESERVED
          </div>
        )}

        {/* Display Code Badge */}
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/10">
          {car.displayCode}
        </div>

        {/* Refined Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {car.brand} {car.model}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {car.year} • {car.color}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 py-2">
          <span className="text-2xl font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg">
            {formatPrice(car.price)}
          </span>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            <span className="truncate font-medium">{car.km.toLocaleString('id-ID')} km</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cog className="h-4 w-4 text-primary" />
            </div>
            <span className="truncate font-medium">{car.transmission}</span>
          </div>
        </div>

        {/* Key Features */}
        {car.keyFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {car.keyFeatures.slice(0, 2).map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                {feature}
              </span>
            ))}
            {car.keyFeatures.length > 2 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                +{car.keyFeatures.length - 2} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
