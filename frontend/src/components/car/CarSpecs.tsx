/**
 * CarSpecs - Premium specs table
 */

import React from 'react';
import { Calendar, Gauge, Cog, Palette, Fuel, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Car } from '../../api/cars';

interface CarSpecsProps {
  car: Car;
}

export function CarSpecs({ car }: CarSpecsProps) {
  const specs = [
    {
      icon: Hash,
      label: 'Display Code',
      value: car.displayCode,
    },
    {
      icon: Calendar,
      label: 'Year',
      value: car.year.toString(),
    },
    {
      icon: Gauge,
      label: 'Mileage',
      value: `${car.km.toLocaleString('id-ID')} km`,
    },
    {
      icon: Cog,
      label: 'Transmission',
      value: car.transmission,
    },
    {
      icon: Palette,
      label: 'Color',
      value: car.color,
    },
    {
      icon: Fuel,
      label: 'Fuel Type',
      value: car.fuelType || 'Not specified',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {specs.map((spec, index) => {
            const Icon = spec.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {spec.label}
                  </p>
                  <p className="font-semibold truncate">{spec.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
