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
        'group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white',
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
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Fuel className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Status Badge */}
        {car.status === 'sold' && (
          <div className="absolute top-3 left-3 bg-destructive text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            SOLD
          </div>
        )}
        {car.status === 'booking' && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            BOOKING
          </div>
        )}

        {/* Display Code Badge */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
          {car.displayCode}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
            {car.brand} {car.model}
          </h3>
          <p className="text-xs text-muted-foreground">
            {car.year} • {car.color}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">
            {formatPrice(car.price)}
          </span>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{car.km.toLocaleString('id-ID')} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cog className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{car.transmission}</span>
          </div>
        </div>

        {/* Key Features */}
        {car.keyFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {car.keyFeatures.slice(0, 2).map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                {feature}
              </span>
            ))}
            {car.keyFeatures.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                +{car.keyFeatures.length - 2}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
