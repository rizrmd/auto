/**
 * Admin Analytics Page
 * Simple demand tracking dashboard - focuses on what customers are searching for
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminAPI } from '../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Search, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  topCars: Array<{
    carName: string;
    brand: string;
    model: string;
    year: number | null;
    searchCount: number;
    searchDays: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    searchCount: number;
    searchDays: number;
  }>;
  summary: {
    totalSearches: number;
    uniqueCars: number;
    avgSearchesPerDay: number;
    dateRange: {
      start: string;
      end: string;
      days: number;
    };
  };
}

export function AdminAnalyticsPage() {
  const { tenant } = useAdminAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [startDate, endDate]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getDemandReport(startDate, endDate);
      setAnalyticsData(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadAnalyticsData();
  };

  const presetRanges = [
    { label: '7 Hari', days: 7 },
    { label: '30 Hari', days: 30 },
    { label: '90 Hari', days: 90 },
  ];

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshData}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data</h3>
          <p className="text-gray-500 mb-4">
            Mulai lakukan pencarian untuk melihat analisis demand di sini
          </p>
          <Button onClick={() => window.location.href = '/'}>Lihat Katalog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Pantau mobil yang paling banyak dicari customer
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pilih Rentang Waktu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetRange(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Pencarian</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.summary.totalSearches.toLocaleString('id-ID')}
                </p>
              </div>
              <Search className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Rata-rata/Hari</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.summary.avgSearchesPerDay.toLocaleString('id-ID')}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Mobil Unik</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.summary.uniqueCars.toLocaleString('id-ID')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Periode</p>
                <p className="text-lg font-bold text-gray-900">
                  {analyticsData.summary.dateRange.days} hari
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cars */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mobil Paling Banyak Dicari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.topCars.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.topCars.slice(0, 10).map((car, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                        <h4 className="font-medium text-gray-900">{car.carName}</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {car.brand} {car.model} {car.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {car.searchCount.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">kali</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">Belum ada data pencarian mobil</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Keyword Paling Populer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.topKeywords.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.topKeywords.slice(0, 10).map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                        <h4 className="font-medium text-gray-900 capitalize">{keyword.keyword}</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Dicari {keyword.searchDays} hari berbeda
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {keyword.searchCount.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">kali</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">Belum ada data keyword</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Insight Bisnis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">💡 Rekomendasi Stok</h4>
              {analyticsData.topCars.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Customer sedang mencari <strong>{analyticsData.topCars[0].carName}</strong> ({analyticsData.topCars[0].searchCount} kali)
                  </p>
                  <p className="text-sm text-gray-600">
                    Pertimbangkan untuk menambah stok mobil jenis ini
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Mulai pencarian untuk melihat rekomendasi</p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">🎯 Tren Pencarian</h4>
              {analyticsData.topKeywords.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Keyword populer: <strong>{analyticsData.topKeywords[0].keyword}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Gunakan keyword ini di judul iklan untuk menarik perhatian
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Mulai pencarian untuk melihat tren</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}