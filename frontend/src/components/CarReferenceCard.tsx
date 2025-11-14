/**
 * CarReferenceCard - Compact car card for blog post context
 * Embedded inline when a car is mentioned in blog content
 */

import React from 'react';
import { Car, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface CarReferenceCardProps {
  car: {
    slug: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    price: string;
    primaryPhoto: string | null;
  };
  className?: string;
}

export function CarReferenceCard({ car, className }: CarReferenceCardProps) {
  const formatPrice = (price: string) => {
    const numPrice = parseInt(price);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <Card
      className={cn(
        'my-6 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
        'hover:shadow-lg hover:border-primary/40 transition-all duration-300',
        className
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Car Image */}
          <div className="relative sm:w-48 h-40 sm:h-auto overflow-hidden bg-muted flex-shrink-0">
            {car.primaryPhoto ? (
              <img
                src={car.primaryPhoto}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Car className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}

            {/* Premium badge overlay */}
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold shadow-md">
              TERSEDIA
            </div>
          </div>

          {/* Car Info */}
          <div className="flex-1 p-4 sm:py-4 sm:pr-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1 line-clamp-1">
                {car.brand} {car.model}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tahun {car.year}
              </p>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(car.price)}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              asChild
              className="w-full sm:w-auto group"
              size="sm"
            >
              <a href={`/cars/${car.slug}`}>
                Lihat Detail
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
