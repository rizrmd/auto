/**
 * Header - Premium site header with tenant branding
 */

import React, { useState } from 'react';
import { Menu, X, Phone, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { SearchBar } from '../shared/SearchBar';
import { useTenantContext } from '../../context/TenantContext';
import { cn } from '@/lib/utils';
import type { Car } from '../../api/cars';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onCarSelect?: (car: Car) => void;
  showSearch?: boolean;
  className?: string;
}

export function Header({
  onSearch,
  onCarSelect,
  showSearch = true,
  className,
}: HeaderProps) {
  const { tenant } = useTenantContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  const handleCarSelect = (car: Car) => {
    window.location.href = `/cars/${car.slug}`;
    onCarSelect?.(car);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b shadow-sm',
        className
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="Go to homepage"
          >
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: tenant?.primaryColor || '#FF5722' }}
                >
                  {tenant?.name?.[0] || 'A'}
                </div>
                <span className="font-bold text-lg hidden sm:inline">
                  {tenant?.name || 'AutoLeads'}
                </span>
              </div>
            )}
          </button>

          {/* Desktop Search */}
          {showSearch && (
            <div className="hidden md:block flex-1 max-w-md">
              <SearchBar onSearch={onSearch} onCarSelect={handleCarSelect} />
            </div>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-accent"
            >
              <a href="/cars">Browse Cars</a>
            </Button>
            {tenant?.phone && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={`tel:${tenant.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  {tenant.phone}
                </a>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-3">
            <SearchBar onSearch={onSearch} onCarSelect={handleCarSelect} />
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2 animate-in slide-in-from-top-5 duration-200">
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <a href="/cars">Browse Cars</a>
            </Button>
            {tenant?.phone && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <a href={`tel:${tenant.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us
                </a>
              </Button>
            )}
            {tenant?.address && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={tenant.mapsUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Visit Showroom
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
