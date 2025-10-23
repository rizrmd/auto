/**
 * CarFeatures - Key features with premium badges
 */

import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface CarFeaturesProps {
  features: string[];
  conditionNotes?: string | null;
}

export function CarFeatures({ features, conditionNotes }: CarFeaturesProps) {
  if (features.length === 0 && !conditionNotes) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Features Grid */}
        {features.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Condition Notes */}
        {conditionNotes && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
              Condition Notes
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {conditionNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
