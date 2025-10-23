/**
 * CarGrid - Responsive grid of car cards
 */

import React from 'react';
import { CarCard } from './CarCard';
import { cn } from '@/lib/utils';
import type { Car } from '../../api/cars';

interface CarGridProps {
  cars: Car[];
  onCarClick?: (car: Car) => void;
  className?: string;
}

export function CarGrid({ cars, onCarClick, className }: CarGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
        className
      )}
    >
      {cars.map((car) => (
        <CarCard
          key={car.id}
          car={car}
          onClick={() => onCarClick?.(car)}
        />
      ))}
    </div>
  );
}
