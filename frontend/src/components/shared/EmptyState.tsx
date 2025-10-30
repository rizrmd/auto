/**
 * EmptyState - Premium empty state component
 */

import React from 'react';
import { SearchX, Car } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'search' | 'car';
  actionLabel?: string;
  onAction?: (e?: React.MouseEvent) => void;
  actionAsLink?: boolean;
  actionHref?: string;
}

export function EmptyState({
  title = 'Tidak ada mobil ditemukan',
  description = 'Coba sesuaikan filter atau kata kunci pencarian Kamu',
  icon = 'search',
  actionLabel,
  onAction,
  actionAsLink = false,
  actionHref = '#',
}: EmptyStateProps) {
  const Icon = icon === 'search' ? SearchX : Car;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button 
          asChild={actionAsLink}
          onClick={actionAsLink ? undefined : onAction} 
          size="lg" 
          className="shadow-sm"
        >
          {actionAsLink ? (
            <a href={actionHref} onClick={onAction}>
              {actionLabel}
            </a>
          ) : (
            <>{actionLabel}</>
          )}
        </Button>
      )}
    </div>
  );
}
