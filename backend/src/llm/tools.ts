/**
 * Tool Definitions for AutoLeads Function Calling
 * OpenAI-compatible function calling schemas for GLM-4.5V via ZAI API
 *
 * This module defines the tools (functions) that the LLM can call to interact with the AutoLeads system.
 * Each tool represents a specific action the bot can perform on behalf of the customer.
 */

/**
 * Tool definition interface (OpenAI format)
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

/**
 * All available tools for the AutoLeads WhatsApp bot
 * These tools enable the LLM to take concrete actions based on customer requests
 */
export const tools: Tool[] = [
  // ========== TOOL 1: Search Cars ==========
  {
    type: 'function',
    function: {
      name: 'search_cars',
      description: 'Search for available cars in inventory based on customer criteria like brand, model, price range, transmission, color, etc. Use this when customer asks about cars with specific requirements. Examples: "mobil matic dibawah 100 juta", "ada avanza 2020?", "cari innova putih", "budget 150 juta", "manual transmission", "Toyota hitam".',
      parameters: {
        type: 'object',
        properties: {
          brand: {
            type: 'string',
            description: 'Car brand/manufacturer (e.g., "Toyota", "Honda", "Daihatsu", "Mitsubishi", "Mercedes-Benz", "BMW"). Case-insensitive, partial match supported.',
          },
          model: {
            type: 'string',
            description: 'Car model name (e.g., "Avanza", "Xenia", "Innova", "Jazz", "CR-V", "C-Class"). Case-insensitive, partial match supported.',
          },
          year: {
            type: 'number',
            description: 'Specific manufacturing year (e.g., 2020, 2021, 2019). For year ranges, use minPrice/maxPrice as proxy for newer/older cars.',
          },
          minPrice: {
            type: 'number',
            description: 'Minimum price in Indonesian Rupiah (e.g., 100000000 for 100 juta). Use when customer mentions budget floor like "diatas 100 juta", "minimal 150 juta", "dari 80 juta".',
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price in Indonesian Rupiah (e.g., 150000000 for 150 juta). Use when customer mentions budget ceiling like "dibawah 200 juta", "maksimal 100 juta", "sampai 120 juta", "budget 150 juta".',
          },
          transmission: {
            type: 'string',
            enum: ['Manual', 'Matic'],
            description: 'Transmission type. Use "Matic" for automatic/AT/matic/otomatis. Use "Manual" for manual transmission. IMPORTANT: Values are case-sensitive, use exact values "Manual" or "Matic".',
          },
          color: {
            type: 'string',
            description: 'Car color in Indonesian (e.g., "Hitam", "Putih", "Silver", "Merah", "Abu-abu"). Case-insensitive, partial match supported.',
          },
          fuelType: {
            type: 'string',
            description: 'Fuel type (e.g., "Bensin", "Diesel", "Hybrid", "Electric"). Use when customer specifies fuel preference.',
          },
          maxKm: {
            type: 'number',
            description: 'Maximum odometer reading in kilometers (e.g., 50000). Use when customer wants low-mileage cars like "KM rendah", "dibawah 50rb KM".',
          },
        },
        required: [],
      },
    },
  },

  // ========== TOOL 2: Get Car Details ==========
  {
    type: 'function',
    function: {
      name: 'get_car_details',
      description: 'Get complete details of a specific car including full specs, features, condition notes, and pricing. Use this when customer asks for full information about a specific car they are interested in, or mentions a display code and wants "detail lengkapnya", "spesifikasinya", "info mobil ini", "lebih lengkap tentang [code]".',
      parameters: {
        type: 'object',
        properties: {
          displayCode: {
            type: 'string',
            description: 'The car display code (e.g., "A01", "#A01", "B12", "MB001"). Will be normalized to uppercase without # symbol. REQUIRED.',
          },
        },
        required: ['displayCode'],
      },
    },
  },

  // ========== TOOL 3: Send Car Photos ==========
  {
    type: 'function',
    function: {
      name: 'send_car_photos',
      description: 'IMMEDIATELY send car photos to customer via WhatsApp. CRITICAL: You MUST call this tool when customer requests photos - never just promise to send without calling this tool. WORKFLOW: (1) If you don\'t know the displayCode, call search_cars first to get it, (2) Then IMMEDIATELY call this tool with the displayCode. Keywords indicating photo request: "lihat foto", "kirim foto", "kirim gambar", "show photos", "mau liat", "ada foto?", "gambarnya dong", "send pics", "foto mobil", "fotonya", "gambar mobil", "foto [car name]", "kalau foto", "minta foto". NEVER say "akan mengirim foto" without actually calling this tool - that is a critical error.',
      parameters: {
        type: 'object',
        properties: {
          displayCode: {
            type: 'string',
            description: 'The car display code (e.g., "A01", "#A01", "B12"). Will be normalized to uppercase without # symbol. REQUIRED.',
          },
          maxPhotos: {
            type: 'number',
            description: 'Number of photos to send (1-5). Default is 3. Use fewer (1-2) for quick preview, more (4-5) for detailed inspection.',
            default: 3,
          },
        },
        required: ['displayCode'],
      },
    },
  },

  // ========== TOOL 4: Send Location Info ==========
  {
    type: 'function',
    function: {
      name: 'send_location_info',
      description: 'Send showroom location, full address, Google Maps link, contact numbers, and business hours to customer. Use this when customer asks about location, address, directions, opening hours, or how to visit. Keywords: "dimana lokasi", "alamat showroom", "jam buka", "kapan buka", "cara ke sana", "where are you", "lokasi", "alamat".',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },

  // ========== TOOL 5: Get Price Quote ==========
  {
    type: 'function',
    function: {
      name: 'get_price_quote',
      description: 'Get detailed price information including exact price, down payment options (20%, 30%, 40%), installment estimates for different tenors (1-5 years), and negotiation possibilities. Use this when customer specifically asks about pricing, payment options, or financing. Keywords: "berapa harganya", "bisa kredit?", "DP berapa", "cicilan per bulan", "cash atau credit", "nego?", "harga nett", "bisa dicicil".',
      parameters: {
        type: 'object',
        properties: {
          displayCode: {
            type: 'string',
            description: 'The car display code (e.g., "A01", "#A01", "B12"). Will be normalized to uppercase without # symbol. REQUIRED.',
          },
        },
        required: ['displayCode'],
      },
    },
  },

  // ========== TOOL 6: Get Financing Info ==========
  {
    type: 'function',
    function: {
      name: 'get_financing_info',
      description: 'Calculate detailed financing/credit information and monthly installments based on specific parameters. Use this when customer wants custom calculations with specific down payment amount or percentage and specific tenor. For general price inquiries, use get_price_quote instead.',
      parameters: {
        type: 'object',
        properties: {
          carPrice: {
            type: 'number',
            description: 'Total car price in Rupiah. REQUIRED.',
          },
          downPayment: {
            type: 'number',
            description: 'Specific down payment amount in Rupiah (optional). Use this OR downPaymentPercent, not both.',
          },
          downPaymentPercent: {
            type: 'number',
            description: 'Down payment as percentage of car price (e.g., 20 for 20%, 30 for 30%). Use this OR downPayment, not both.',
          },
          tenure: {
            type: 'number',
            description: 'Loan tenure in years. Common options: 1, 2, 3, 4, 5. REQUIRED.',
          },
        },
        required: ['carPrice', 'tenure'],
      },
    },
  },

  // ========== TOOL 7: Schedule Test Drive ==========
  {
    type: 'function',
    function: {
      name: 'schedule_test_drive',
      description: 'Schedule a test drive appointment for the customer. Creates a task for sales team to follow up. Use this when customer wants to test drive a car, schedule a viewing, or visit to see the car. Keywords: "mau test drive", "coba mobil", "lihat langsung", "kunjungan", "booking test drive".',
      parameters: {
        type: 'object',
        properties: {
          displayCode: {
            type: 'string',
            description: 'The car display code customer wants to test drive. REQUIRED.',
          },
          preferredDate: {
            type: 'string',
            description: 'Preferred date for test drive in YYYY-MM-DD format (e.g., "2025-11-01"). REQUIRED.',
          },
          preferredTime: {
            type: 'string',
            description: 'Preferred time like "morning", "afternoon", "evening", or specific time like "10:00", "14:30" (optional).',
          },
          customerName: {
            type: 'string',
            description: 'Customer full name (optional but recommended for better service).',
          },
          notes: {
            type: 'string',
            description: 'Any additional notes or special requirements from customer (optional).',
          },
        },
        required: ['displayCode', 'preferredDate'],
      },
    },
  },

  // ========== TOOL 8: Check Trade-In ==========
  {
    type: 'function',
    function: {
      name: 'check_trade_in',
      description: 'Check if trade-in service is available and provide information about the trade-in process. Use this when customer asks about trading in their old car, tukar tambah, or using their current car as down payment. Keywords: "trade in", "tukar tambah", "tuker mobil lama", "jual mobil lama".',
      parameters: {
        type: 'object',
        properties: {
          currentCarBrand: {
            type: 'string',
            description: 'Brand of car customer wants to trade in (optional).',
          },
          currentCarModel: {
            type: 'string',
            description: 'Model of car customer wants to trade in (optional).',
          },
          currentCarYear: {
            type: 'number',
            description: 'Year of car customer wants to trade in (optional).',
          },
        },
        required: [],
      },
    },
  },
];

/**
 * Get tool by name
 */
export function getToolByName(name: string): Tool | undefined {
  return tools.find(tool => tool.function.name === name);
}

/**
 * Validate tool call arguments
 */
export function validateToolArguments(
  tool: Tool,
  args: Record<string, any>
): { valid: boolean; error?: string } {
  const { required, properties } = tool.function.parameters;

  // Check required parameters
  for (const reqParam of required) {
    if (!(reqParam in args)) {
      return {
        valid: false,
        error: `Missing required parameter: ${reqParam}`,
      };
    }
  }

  // Validate parameter types
  for (const [key, value] of Object.entries(args)) {
    if (!(key in properties)) {
      return {
        valid: false,
        error: `Unknown parameter: ${key}`,
      };
    }

    const expectedType = properties[key].type;
    const actualType = typeof value;

    if (expectedType === 'number' && actualType !== 'number') {
      return {
        valid: false,
        error: `Parameter ${key} must be a number`,
      };
    }

    if (expectedType === 'string' && actualType !== 'string') {
      return {
        valid: false,
        error: `Parameter ${key} must be a string`,
      };
    }

    // Validate enum values
    if (properties[key].enum && !properties[key].enum.includes(value)) {
      return {
        valid: false,
        error: `Parameter ${key} must be one of: ${properties[key].enum.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format tool list for logging
 */
export function formatToolsForLogging(): string {
  return tools.map(t => t.function.name).join(', ');
}

/**
 * Helper to normalize display code
 * Removes # symbol and whitespace, converts to uppercase
 */
export function normalizeDisplayCode(code: string): string {
  return code.replace(/[#\s]/g, '').toUpperCase();
}

/**
 * Helper to format price in Indonesian Rupiah
 */
export function formatPrice(price: number | bigint): string {
  const priceNum = typeof price === 'bigint' ? Number(price) : price;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceNum);
}

/**
 * Helper to format business hours for display
 */
export function formatBusinessHours(hours: Record<string, string> | null | undefined): string {
  if (!hours) {
    return 'Senin - Sabtu: 09:00 - 18:00\nMinggu: 10:00 - 16:00';
  }

  const dayNames: Record<string, string> = {
    mon: 'Senin',
    tue: 'Selasa',
    wed: 'Rabu',
    thu: 'Kamis',
    fri: 'Jumat',
    sat: 'Sabtu',
    sun: 'Minggu',
  };

  return Object.entries(hours)
    .map(([day, time]) => `${dayNames[day] || day}: ${time}`)
    .join('\n');
}

/**
 * TypeScript type definitions for tool parameters
 */
export interface SearchCarsParams {
  brand?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  transmission?: 'Manual' | 'Matic';
  color?: string;
  fuelType?: string;
  maxKm?: number;
}

export interface GetCarDetailsParams {
  displayCode: string;
}

export interface SendCarPhotosParams {
  displayCode: string;
  maxPhotos?: number;
}

export interface SendLocationInfoParams {
  // No parameters
}

export interface GetPriceQuoteParams {
  displayCode: string;
}

export interface GetFinancingInfoParams {
  carPrice: number;
  downPayment?: number;
  downPaymentPercent?: number;
  tenure: number;
}

export interface ScheduleTestDriveParams {
  displayCode: string;
  preferredDate: string;
  preferredTime?: string;
  customerName?: string;
  notes?: string;
}

export interface CheckTradeInParams {
  currentCarBrand?: string;
  currentCarModel?: string;
  currentCarYear?: number;
}

/**
 * Union type of all possible tool parameters
 */
export type ToolParams =
  | SearchCarsParams
  | GetCarDetailsParams
  | SendCarPhotosParams
  | SendLocationInfoParams
  | GetPriceQuoteParams
  | GetFinancingInfoParams
  | ScheduleTestDriveParams
  | CheckTradeInParams;
