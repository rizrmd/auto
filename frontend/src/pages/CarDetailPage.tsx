/**
 * CarDetailPage - Premium single car detail page
 */

import React, { useEffect } from 'react';
import { ArrowLeft, Share2, Heart, Loader2, Calendar, Gauge, Cog } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CarGallery } from '../components/car/CarGallery';
import { CarSpecs } from '../components/car/CarSpecs';
import { CarFeatures } from '../components/car/CarFeatures';
import { WhatsAppButton } from '../components/car/WhatsAppButton';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useCarDetail } from '../hooks/useCarDetail';

interface CarDetailPageProps {
  carSlug: string;
}

export function CarDetailPage({ carSlug }: CarDetailPageProps) {
  const { data: car, loading, error } = useCarDetail(carSlug);

  // Update page title
  useEffect(() => {
    if (car) {
      document.title = `${car.publicName} | AutoLeads`;
    }
  }, [car]);

  const handleBack = () => {
    window.history.back();
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = car ? `Lihat ${car.publicName}` : 'Lihat mobil ini';

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch (err) {
        console.log('Bagikan dibatalkan');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      alert('Link berhasil disalin!');
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showSearch={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showSearch={false} />
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Mobil Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'Mobil yang Anda cari tidak ada'}
            </p>
            <Button asChild>
              <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>Kembali</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showSearch={false} />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Back Button */}
          <Button
            asChild
            variant="ghost"
            className="mb-4 -ml-2"
          >
            <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </a>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Gallery & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              <CarGallery
                photos={car.photos}
                initialIndex={car.primaryPhotoIndex}
                alt={car.publicName}
              />

              {/* Title & Price Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold mb-2">
                        {car.brand} {car.model}
                      </h1>
                      <p className="text-muted-foreground">
                        {car.year} • {car.color} • {car.displayCode}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {car.status === 'sold' && (
                      <span className="px-3 py-1 bg-destructive text-white text-sm font-semibold rounded-full">
                        TERJUAL
                      </span>
                    )}
                    {car.status === 'booking' && (
                      <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-semibold rounded-full">
                        BOOKING
                      </span>
                    )}
                    {car.status === 'available' && (
                      <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                        TERSEDIA
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-primary">
                      {formatPrice(car.price)}
                    </span>
                  </div>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground mb-0.5">Tahun</p>
                      <p className="font-semibold">{car.year}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Gauge className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground mb-0.5">Kilometer</p>
                      <p className="font-semibold">{car.km.toLocaleString('id-ID')} km</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Cog className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground mb-0.5">Transmisi</p>
                      <p className="font-semibold">{car.transmission}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={handleShare}
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Bagikan
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // TODO: Implement save functionality
                        alert('Fitur simpan segera hadir!');
                      }}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Simpan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {car.description && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Deskripsi</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {car.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Specs */}
              <CarSpecs car={car} />

              {/* Features */}
              <CarFeatures
                features={car.keyFeatures}
                conditionNotes={car.conditionNotes}
              />
            </div>

            {/* Right Column - Contact Card (Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Tertarik?</h3>
                      <p className="text-sm text-muted-foreground">
                        Hubungi kami untuk informasi lebih lanjut atau jadwalkan kunjungan
                      </p>
                    </div>

                    <WhatsAppButton car={car} sticky={false} />

                    <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Biasanya merespons dalam hitungan menit
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Pelayanan profesional terjamin
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
