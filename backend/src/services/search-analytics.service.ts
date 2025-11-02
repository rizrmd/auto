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
  async logSearch(tenantId: number, keyword: string, results: any[]) {
    if (!keyword || keyword.trim().length < 2) {
      return; // Don't log very short queries
    }

    const cleanKeyword = keyword.trim();
    const searchDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const firstResult = results[0]; // Get the first (most relevant) result

    try {
      // Check if we already have this search for today
      const existingSearch = await prisma.searchDemand.findFirst({
        where: {
          tenantId,
          carId: firstResult?.id || null,
          searchDate: new Date(searchDate),
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
  async getDemandReport(tenantId: number, startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end date

      // Get top cars by search count
      const topCars = await prisma.searchDemand.groupBy({
        by: ['carId'],
        where: {
          tenantId,
          searchDate: {
            gte: start,
            lte: end,
          },
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
        where: {
          tenantId,
          searchDate: {
            gte: start,
            lte: end,
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
        take: 15,
      });

      const formattedKeywords = topKeywords.map(item => ({
        keyword: item.keyword,
        searchCount: item._sum.searchCount || 0,
        searchDays: item._count.searchCount,
      }));

      // Get daily search trends
      const dailyTrends = await prisma.searchDemand.groupBy({
        by: ['searchDate'],
        where: {
          tenantId,
          searchDate: {
            gte: start,
            lte: end,
          },
        },
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

      // Calculate total searches from all keywords (including those without cars)
      const totalSearches = formattedKeywords.reduce((sum, item) => sum + item.searchCount, 0);
      const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const avgSearchesPerDay = daysInRange > 0 ? Math.round(totalSearches / daysInRange * 10) / 10 : 0;

      return {
        topCars: topCarsWithDetails,
        topKeywords: formattedKeywords,
        dailyTrends: formattedTrends,
        summary: {
          totalSearches,
          uniqueCars: topCarsWithDetails.length,
          uniqueKeywords: formattedKeywords.length,
          avgSearchesPerDay,
          dateRange: {
            start: startDate,
            end: endDate,
            days: daysInRange,
          },
        },
      };
    } catch (error) {
      console.error('[SEARCH_ANALYTICS] Failed to get demand report:', error);
      throw error;
    }
  }
}