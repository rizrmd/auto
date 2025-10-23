/**
 * HomePage - Premium landing page with hero and featured cars
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight, Car, Shield, TrendingUp } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CarGrid } from '../components/car/CarGrid';
import { Button } from '../components/ui/button';
import { getFeaturedCars, type Car as CarType } from '../api/cars';
import { useTenantContext } from '../context/TenantContext';

export function HomePage() {
  const { tenant } = useTenantContext();
  const [featuredCars, setFeaturedCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedCars() {
      setLoading(true);
      const response = await getFeaturedCars(6);
      if (response.data?.cars) {
        setFeaturedCars(response.data.cars);
      }
      setLoading(false);
    }

    loadFeaturedCars();
  }, []);

  const handleCarClick = (car: CarType) => {
    window.location.href = `/cars/${car.slug}`;
  };

  const handleBrowseAll = () => {
    window.location.href = '/cars';
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      window.location.href = `/cars?search=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} showSearch={true} />

      {/* Hero Section */}
      <section
        className="relative py-20 md:py-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tenant?.primaryColor || '#FF5722'}15 0%, ${tenant?.secondaryColor || '#000000'}05 100%)`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect{' '}
              <span
                className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              >
                Dream Car
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Browse our curated collection of premium used cars. Quality guaranteed, competitive prices, and exceptional service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleBrowseAll}
                className="text-base shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Browse All Cars
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {tenant?.whatsappNumber && (
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="text-base shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <a
                    href={`https://wa.me/${tenant.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact Us
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
              <p className="text-muted-foreground">
                Every car thoroughly inspected and verified for your peace of mind
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-muted-foreground">
                Competitive pricing with transparent costs and no hidden fees
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
              <p className="text-muted-foreground">
                Diverse inventory of brands and models to match your needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Cars</h2>
              <p className="text-muted-foreground">
                Handpicked selection of our best vehicles
              </p>
            </div>
            <Button variant="outline" onClick={handleBrowseAll}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : featuredCars.length > 0 ? (
            <CarGrid cars={featuredCars} onCarClick={handleCarClick} />
          ) : (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No featured cars available</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20"
        style={{
          background: `linear-gradient(135deg, ${tenant?.primaryColor || '#FF5722'}10 0%, ${tenant?.secondaryColor || '#000000'}05 100%)`,
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Dream Car?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse our full inventory or contact us for personalized assistance
          </p>
          <Button
            size="lg"
            onClick={handleBrowseAll}
            className="shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Browse All Cars
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
