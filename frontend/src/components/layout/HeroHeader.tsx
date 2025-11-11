/**
 * HeroHeader - Customizable hero section component for tenant branding
 * Features: responsive design, accessibility, tenant customization with fallbacks
 */

import React from 'react';
import { ArrowRight, Car, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { useTenantContext } from '../../context/TenantContext';
import { cn } from '../../lib/utils';

interface HeroHeaderProps {
  onBrowseAll?: (e: React.MouseEvent) => void;
  onWhatsAppClick?: (e: React.MouseEvent) => void;
  className?: string;
  showWhatsApp?: boolean;
}

export function HeroHeader({
  onBrowseAll,
  onWhatsAppClick,
  className,
  showWhatsApp = true,
}: HeroHeaderProps) {
  const { tenant } = useTenantContext();

  // Default fallback values for maximum compatibility
  const defaultValues = {
    tagline: "Mobil Bekas Berkualitas",
    title: "Temukan Mobil Impian Kamu",
    subtitle: "Jelajahi koleksi mobil bekas pilihan kami. Kualitas terjamin, harga terpercaya, dan pelayanan terbaik.",
    ctaText: "Lihat Semua Mobil",
  };

  // Use tenant data with robust fallbacks
  const tagline = tenant?.headerTagline?.trim() || defaultValues.tagline;
  const title = tenant?.headerTitle?.trim() || defaultValues.title;
  const subtitle = tenant?.headerSubtitle?.trim() || defaultValues.subtitle;
  const ctaText = tenant?.headerCtaText?.trim() || defaultValues.ctaText;

  // Smart title highlighting - find and highlight the "dream/emotional" word
  const renderHighlightedTitle = (titleText: string) => {
    const words = titleText.split(' ');
    const highlightWords = ['impian', 'idaman', 'dream', 'perfect']; // words to highlight

    return words.map((word, index) => {
      const lowerWord = word.toLowerCase();
      const shouldHighlight = highlightWords.some(hw => lowerWord.includes(hw));

      return (
        <span key={index}>
          {shouldHighlight ? (
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {word}
            </span>
          ) : (
            <span>{word}</span>
          )}
          {index < words.length - 1 && ' '}
        </span>
      );
    });
  };

  const handleBrowseAll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBrowseAll) {
      onBrowseAll(e);
    } else {
      window.location.href = '/cars';
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onWhatsAppClick) {
      onWhatsAppClick(e);
    } else if (tenant?.whatsappNumber) {
      const cleanNumber = tenant.whatsappNumber.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle phone call if phone number is available
  const handlePhoneCall = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tenant?.phone) {
      window.open(`tel:${tenant.phone}`, '_self');
    }
  };

  return (
    <section
      className={cn(
        "relative py-16 sm:py-20 md:py-32 lg:py-40 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5",
        "min-h-[600px] flex items-center justify-center",
        className
      )}
      aria-labelledby="hero-title"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline with responsive sizing */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8">
            <Car className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-semibold text-primary">{tagline}</span>
          </div>

          {/* Title with responsive typography */}
          <h1
            id="hero-title"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight"
          >
            {renderHighlightedTitle(title)}
          </h1>

          {/* Subtitle with responsive typography and better line height */}
          <p
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed max-w-3xl mx-auto font-light px-2"
          >
            {subtitle}
          </p>

          {/* Call-to-Action Buttons with better mobile spacing */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-2">
            {/* Primary CTA Button */}
            <Button
              asChild
              size="lg"
              className="text-sm sm:text-base min-w-[180px] sm:min-w-[200px] shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
              style={{
                backgroundColor: tenant?.primaryColor || undefined,
                borderColor: tenant?.primaryColor || undefined,
              }}
            >
              <a
                href="/cars"
                onClick={handleBrowseAll}
                className="flex items-center justify-center"
              >
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </a>
            </Button>

            {/* WhatsApp Button */}
            {showWhatsApp && tenant?.whatsappNumber && (
              <Button
                variant="outline"
                size="lg"
                asChild
                className="text-sm sm:text-base min-w-[180px] sm:min-w-[200px] w-full sm:w-auto"
                style={{
                  borderColor: tenant?.secondaryColor || undefined,
                  color: tenant?.secondaryColor || undefined,
                }}
              >
                <a
                  href="#"
                  onClick={handleWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                  aria-label="Hubungi kami via WhatsApp"
                >
                  <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                  Hubungi Kami
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Premium Decorative Elements with responsive sizing */}
      <div
        className="absolute top-10 left-5 sm:top-20 sm:left-10 w-64 h-64 sm:w-96 sm:h-96 bg-primary/8 rounded-full blur-3xl animate-pulse"
        style={{
          animationDuration: '4s',
          backgroundColor: `${tenant?.primaryColor || '#3B82F6'}20`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none bottom-10 right-5 sm:bottom-20 sm:right-10 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-secondary/8 rounded-full blur-3xl animate-pulse"
        style={{
          animationDuration: '6s',
          backgroundColor: `${tenant?.secondaryColor || '#000000'}20`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-accent/5 rounded-full blur-3xl"
        style={{
          backgroundColor: `${tenant?.primaryColor || '#3B82F6'}10`,
        }}
        aria-hidden="true"
      />
    </section>
  );
}

export default HeroHeader;