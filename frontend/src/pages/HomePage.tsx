/**
 * HomePage - Premium landing page with hero and featured cars
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight, Car, Shield, TrendingUp } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { HeroHeader } from '../components/layout/HeroHeader';
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

  const handleBrowseAll = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/cars';
  };

  const handleSearch = (query: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (query.trim()) {
        window.location.href = `/cars?search=${encodeURIComponent(query)}`;
      }
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} showSearch={true} />

      {/* Customizable Hero Section */}
      <HeroHeader
        onBrowseAll={handleBrowseAll}
        showWhatsApp={!!tenant?.whatsappNumber}
      />

      {/* Premium Features Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group text-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Kualitas Terjamin</h3>
              <p className="text-muted-foreground leading-relaxed">
                Setiap mobil diperiksa secara menyeluruh untuk ketenangan pikiran Kamu
              </p>
            </div>

            <div className="group text-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Harga Terbaik</h3>
              <p className="text-muted-foreground leading-relaxed">
                Harga kompetitif dengan biaya transparan tanpa biaya tersembunyi
              </p>
            </div>

            <div className="group text-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                <Car className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Pilihan Lengkap</h3>
              <p className="text-muted-foreground leading-relaxed">
                Beragam pilihan merek dan model untuk memenuhi kebutuhan Kamu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Mobil Pilihan</h2>
              <p className="text-lg text-muted-foreground">
                Koleksi terbaik dari kendaraan kami
              </p>
            </div>
            <Button asChild variant="outline" size="lg" className="shrink-0">
              <a href="/cars" onClick={handleBrowseAll}>
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-2xl animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : featuredCars.length > 0 ? (
            <CarGrid cars={featuredCars} onCarClick={handleCarClick} />
          ) : (
            <div className="text-center py-20 px-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Car className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Belum Ada Mobil Pilihan</h3>
              <p className="text-muted-foreground mb-6">Segera hadir koleksi terbaru kami</p>
              <Button asChild>
                <a href="/cars" onClick={handleBrowseAll}>Lihat Semua Mobil</a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Siap Menemukan Mobil Impian Kamu?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Jelajahi koleksi lengkap kami atau hubungi kami untuk bantuan personal
          </p>
          <Button
            asChild
            size="lg"
            className="shadow-xl hover:shadow-2xl text-base px-10"
          >
            <a href="/cars" onClick={handleBrowseAll}>
              Lihat Semua Mobil
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </section>

      <Footer />
    </div>
  );
}
