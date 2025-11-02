/**
 * Search Analytics Service
 *
 * Simple service to track search demand and keyword popularity
 */

import { prisma } from '../db';

export class SearchAnalyticsService {
  /**
   * Log a search query with results
   */
  async logSearch(tenantId: number, keyword: string, results: any[], source: 'website' | 'whatsapp' = 'website', customerPhone?: string) {
    if (!keyword || keyword.trim().length < 2) {
      return; // Don't log very short queries
    }

    const cleanKeyword = keyword.trim();
    const searchDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const firstResult = results[0]; // Get the first (most relevant) result

    // Check if tenant has requested car in inventory
    const unmetNeed = !firstResult && source === 'whatsapp';

    try {
      // Check if we already have this search for today
      const existingSearch = await prisma.searchDemand.findFirst({
        where: {
          tenantId,
          carId: firstResult?.id || null,
          searchDate: new Date(searchDate),
          source,
        },
      });

      if (existingSearch) {
        // Update existing search count
        await prisma.searchDemand.update({
          where: { id: existingSearch.id },
          data: {
            searchCount: {
              increment: 1,
            },
          },
        });
      } else {
        // Create new search record
        await prisma.searchDemand.create({
          data: {
            tenantId,
            carId: firstResult?.id || null,
            keyword: cleanKeyword,
            searchDate: new Date(searchDate),
            searchCount: 1,
            source,
            customerPhone,
            unmetNeed,
          },
        });
      }
    } catch (error) {
      console.error('[SEARCH_ANALYTICS] Failed to log search:', error);
      // Don't throw error - search functionality should continue
    }
  }

  /**
   * Get demand analytics for date range
   */
  async getDemandReport(tenantId: number, startDate: string, endDate: string, source: 'all' | 'website' | 'whatsapp' | 'compare' = 'all') {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end date

      // Helper function to get analytics for specific source
      const getAnalyticsForSource = async (sourceFilter?: 'website' | 'whatsapp') => {
        const whereClause: any = {
          tenantId,
          searchDate: {
            gte: start,
            lte: end,
          },
        };

        if (sourceFilter) {
          whereClause.source = sourceFilter;
        }

        // Get top cars by search count
        const topCars = await prisma.searchDemand.groupBy({
          by: ['carId'],
          where: {
            ...whereClause,
            carId: {
              not: null,
            },
          },
          _sum: {
            searchCount: true,
          },
          _count: {
            searchCount: true,
          },
          orderBy: {
            _sum: {
              searchCount: 'desc',
            },
          },
          take: 10,
        });

        // Get car details for top searches
        const carIds = topCars.map(item => item.carId!).filter(Boolean);
        const cars = await prisma.car.findMany({
          where: {
            id: {
              in: carIds,
            },
          },
          select: {
            id: true,
            publicName: true,
            brand: true,
            model: true,
            year: true,
          },
        });

        // Map car details to search data
        const topCarsWithDetails = topCars.map(item => {
          const car = cars.find(c => c.id === item.carId);
          return {
            carName: car ? car.publicName : 'Unknown Car',
            brand: car?.brand || '',
            model: car?.model || '',
            year: car?.year || null,
            searchCount: item._sum.searchCount || 0,
            searchDays: item._count.searchCount,
          };
        });

        // Get top keywords (including failed searches)
        const topKeywords = await prisma.searchDemand.groupBy({
          by: ['keyword'],
          where: whereClause,
          _sum: {
            searchCount: true,
          },
          _count: {
            searchCount: true,
          },
          orderBy: {
            _sum: {
              searchCount: 'desc',
            },
          },
          take: 15,
        });

        const formattedKeywords = topKeywords.map(item => ({
          keyword: item.keyword,
          searchCount: item._sum.searchCount || 0,
          searchDays: item._count.searchCount,
        }));

        // Get unmet needs (WhatsApp searches with no results)
        const unmetNeedsQuery = {
          ...whereClause,
          source: 'whatsapp',
          carId: null,
          unmetNeed: true,
        };

        const unmetNeeds = await prisma.searchDemand.groupBy({
          by: ['keyword'],
          where: unmetNeedsQuery,
          _sum: {
            searchCount: true,
          },
          _count: {
            searchCount: true,
          },
          orderBy: {
            _sum: {
              searchCount: 'desc',
            },
          },
          take: 10,
        });

        const topUnmetNeeds = unmetNeeds.map(item => ({
          keyword: item.keyword,
          requestCount: item._sum.searchCount || 0,
          source: 'whatsapp',
        }));

        // Get daily search trends
        const dailyTrends = await prisma.searchDemand.groupBy({
          by: ['searchDate'],
          where: whereClause,
          _sum: {
            searchCount: true,
          },
          _count: {
            searchCount: true,
          },
          orderBy: {
            searchDate: 'asc',
          },
        });

        const formattedTrends = dailyTrends.map(item => ({
          date: item.searchDate.toISOString().split('T')[0],
          searchCount: item._sum.searchCount || 0,
          searchSessions: item._count.searchCount,
        }));

        // Calculate total searches
        const totalSearches = formattedKeywords.reduce((sum, item) => sum + item.searchCount, 0);
        const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const avgSearchesPerDay = daysInRange > 0 ? Math.round(totalSearches / daysInRange * 10) / 10 : 0;

        return {
          topCars: topCarsWithDetails,
          topKeywords: formattedKeywords,
          topUnmetNeeds,
          dailyTrends: formattedTrends,
          summary: {
            totalSearches,
            uniqueCars: topCarsWithDetails.length,
            uniqueKeywords: formattedKeywords.length,
            avgSearchesPerDay,
            unmetNeeds: topUnmetNeeds.reduce((sum, item) => sum + item.requestCount, 0),
            dateRange: {
              start: startDate,
              end: endDate,
              days: daysInRange,
            },
          },
        };
      };

      // Handle different source modes
      if (source === 'compare') {
        const websiteData = await getAnalyticsForSource('website');
        const whatsappData = await getAnalyticsForSource('whatsapp');
        const allData = await getAnalyticsForSource();

        return {
          source: 'compare',
          summary: {
            ...allData.summary,
            websiteSearches: websiteData.summary.totalSearches,
            whatsappSearches: whatsappData.summary.totalSearches,
          },
          comparison: {
            website: {
              topCars: websiteData.topCars,
              topKeywords: websiteData.topKeywords,
              dailyTrends: websiteData.dailyTrends,
            },
            whatsapp: {
              topCars: whatsappData.topCars,
              topKeywords: whatsappData.topKeywords,
              topUnmetNeeds: whatsappData.topUnmetNeeds,
              dailyTrends: whatsappData.dailyTrends,
            },
          },
          topUnmetNeeds: whatsappData.topUnmetNeeds,
        };
      } else {
        const analyticsData = await getAnalyticsForSource(source === 'all' ? undefined : source);

        return {
          source,
          ...analyticsData,
          // Add breakdown for 'all' mode
          ...(source === 'all' ? {
            sourceBreakdown: {
              website: (await getAnalyticsForSource('website')).summary.totalSearches,
              whatsapp: (await getAnalyticsForSource('whatsapp')).summary.totalSearches,
            }
          } : {})
        };
      }
    } catch (error) {
      console.error('[SEARCH_ANALYTICS] Failed to get demand report:', error);
      throw error;
    }
  }
}