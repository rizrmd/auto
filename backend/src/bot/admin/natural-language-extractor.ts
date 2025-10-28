/**
 * Natural Language Car Data Extractor
 * Uses LLM to extract car information from freeform natural language input
 *
 * Example inputs that work:
 * - "upload freed matic 2012 harga 145jt kondisi bagus"
 * - "mau upload mobil honda freed tahun 2012"
 * - "tambah mobil freed 145jt km 145rb"
 * - "freed 2012 matic dijual 145 juta"
 */

import { ZaiClient } from '../../llm/zai';
import { CarParser } from './parser';

export interface ExtractedCarData {
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  transmission?: 'Manual' | 'Matic';
  km?: number;
  price?: number;
  plateNumber?: string;
  plateNumberClean?: string;
  keyFeatures?: string[];
  notes?: string;
  fuelType?: string;
}

export interface ExtractionResult {
  success: boolean;
  data: ExtractedCarData;
  method: 'llm' | 'parser' | 'failed';
  confidence: 'high' | 'medium' | 'low';
  rawInput: string;
  errors?: string[];
}

export class NaturalLanguageExtractor {
  private zaiClient: ZaiClient;
  private fallbackParser: CarParser;

  constructor() {
    this.zaiClient = new ZaiClient();
    this.fallbackParser = new CarParser();
  }

  /**
   * Extract car data from natural language input
   * Tries LLM first, falls back to parser if LLM fails
   */
  async extract(input: string): Promise<ExtractionResult> {
    console.log('[NL EXTRACTOR] Processing input:', input);

    // Try LLM extraction first
    const llmResult = await this.extractWithLLM(input);
    if (llmResult.success) {
      return llmResult;
    }

    // Fallback to regex parser
    console.log('[NL EXTRACTOR] LLM extraction failed, using fallback parser');
    const parserResult = this.extractWithParser(input);

    return parserResult;
  }

  /**
   * Extract car data using LLM (natural language understanding)
   */
  private async extractWithLLM(input: string): Promise<ExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(input);

      console.log('[NL EXTRACTOR] Calling LLM for extraction...');
      const response = await this.zaiClient.generateWithRetry(prompt, 2);

      console.log('[NL EXTRACTOR] LLM response:', response.substring(0, 200) + '...');

      // Parse JSON from response
      const extracted = this.parseJsonFromLLMResponse(response);

      if (!extracted) {
        throw new Error('Failed to parse JSON from LLM response');
      }

      // Validate extracted data
      const validation = this.validateExtractedData(extracted);

      if (!validation.isValid) {
        console.warn('[NL EXTRACTOR] Invalid LLM extraction:', validation.errors);
        return {
          success: false,
          data: extracted,
          method: 'failed',
          confidence: 'low',
          rawInput: input,
          errors: validation.errors
        };
      }

      // Normalize and clean data
      const normalizedData = this.normalizeExtractedData(extracted);

      console.log('[NL EXTRACTOR] ✅ LLM extraction successful:', normalizedData);

      return {
        success: true,
        data: normalizedData,
        method: 'llm',
        confidence: this.calculateConfidence(normalizedData),
        rawInput: input
      };

    } catch (error) {
      console.error('[NL EXTRACTOR] LLM extraction error:', error);
      return {
        success: false,
        data: {},
        method: 'failed',
        confidence: 'low',
        rawInput: input,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Build prompt for LLM extraction
   */
  private buildExtractionPrompt(input: string): string {
    return `You are a data extraction specialist for a used car dealership system.

Extract car information from this natural language message:
"${input}"

Extract the following fields (use null if not mentioned):
- brand: Car brand (Toyota, Honda, Daihatsu, Mitsubishi, Suzuki, Nissan, Mazda, Mercedes-Benz, BMW, etc.)
- model: Car model name (Avanza, Jazz, Freed, Xenia, etc.)
- year: Manufacturing year (2000-2025)
- color: Car color (Hitam, Putih, Silver, Abu, Merah, Biru, etc.)
- transmission: "Manual" or "Matic"
- km: Kilometer/mileage (numeric only, no commas)
- price: Price in Rupiah (numeric only, convert "jt"/"juta" to full number)
- plateNumber: License plate (format: B 1234 ABC)
- keyFeatures: Array of key features (velg racing, spoiler, sunroof, etc.)
- notes: Additional condition notes
- fuelType: "Bensin", "Diesel", "Hybrid", or "Listrik"

Important rules:
1. For price: "145jt" = 145000000, "145juta" = 145000000
2. For km: "145rb" = 145000, "145k" = 145000
3. Brand names: Normalize to proper case (Honda, not honda)
4. Transmission: Only "Manual" or "Matic", never "MT" or "AT"
5. If brand is not explicitly stated but model is (like "freed"), infer brand (Honda)
6. Default color is "Silver" if not stated
7. Default transmission is "Manual" if not stated

Common brand-model associations:
- Freed, Jazz, City, Civic, CR-V, HR-V, Brio → Honda
- Avanza, Innova, Fortuner, Rush, Calya, Yaris → Toyota
- Xenia, Terios, Ayla, Sigra, Gran Max → Daihatsu
- Pajero, Xpander, L300 → Mitsubishi
- Ertiga, Baleno, Swift, Wagon R → Suzuki

Return ONLY valid JSON (no markdown, no explanation):
{
  "brand": "Honda",
  "model": "Freed PSD",
  "year": 2012,
  "color": "Silver",
  "transmission": "Matic",
  "km": 145515,
  "price": 145000000,
  "plateNumber": null,
  "keyFeatures": ["Kondisi Bagus"],
  "notes": null,
  "fuelType": "Bensin"
}`;
  }

  /**
   * Parse JSON from LLM response (handle markdown code blocks)
   */
  private parseJsonFromLLMResponse(response: string): ExtractedCarData | null {
    try {
      // Try to find JSON in markdown code block first
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to find JSON object directly
      const objectMatch = response.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      // If no match, try parsing the whole response
      return JSON.parse(response);

    } catch (error) {
      console.error('[NL EXTRACTOR] JSON parse error:', error);
      return null;
    }
  }

  /**
   * Validate extracted data has minimum required fields
   */
  private validateExtractedData(data: ExtractedCarData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields
    if (!data.brand) {
      errors.push('Brand is required');
    }

    if (!data.year || data.year < 2000 || data.year > 2025) {
      errors.push('Valid year (2000-2025) is required');
    }

    if (!data.price || data.price <= 0) {
      errors.push('Valid price is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalize extracted data (clean up, set defaults)
   */
  private normalizeExtractedData(data: ExtractedCarData): ExtractedCarData {
    return {
      brand: data.brand?.trim(),
      model: data.model?.trim() || '',
      year: data.year,
      color: data.color?.trim() || 'Silver',
      transmission: data.transmission || 'Manual',
      km: data.km || 0,
      price: data.price,
      plateNumber: data.plateNumber?.trim(),
      plateNumberClean: data.plateNumber?.replace(/\s+/g, ''),
      keyFeatures: Array.isArray(data.keyFeatures)
        ? data.keyFeatures.filter(f => f && f.trim().length > 0)
        : [],
      notes: data.notes?.trim(),
      fuelType: data.fuelType || 'Bensin'
    };
  }

  /**
   * Calculate confidence level based on extracted data completeness
   */
  private calculateConfidence(data: ExtractedCarData): 'high' | 'medium' | 'low' {
    let score = 0;

    // Required fields (3 points each)
    if (data.brand) score += 3;
    if (data.year) score += 3;
    if (data.price) score += 3;

    // Important fields (2 points each)
    if (data.model) score += 2;
    if (data.km && data.km > 0) score += 2;
    if (data.transmission) score += 2;

    // Optional fields (1 point each)
    if (data.color && data.color !== 'Silver') score += 1;
    if (data.keyFeatures && data.keyFeatures.length > 0) score += 1;
    if (data.notes) score += 1;

    if (score >= 15) return 'high';
    if (score >= 10) return 'medium';
    return 'low';
  }

  /**
   * Fallback: Extract using regex parser
   */
  private extractWithParser(input: string): ExtractionResult {
    try {
      const data = this.fallbackParser.parseAllInOne(input);

      const validation = this.validateExtractedData(data);

      if (!validation.isValid) {
        return {
          success: false,
          data: data,
          method: 'failed',
          confidence: 'low',
          rawInput: input,
          errors: validation.errors
        };
      }

      return {
        success: true,
        data: data,
        method: 'parser',
        confidence: this.calculateConfidence(data),
        rawInput: input
      };

    } catch (error) {
      console.error('[NL EXTRACTOR] Parser extraction error:', error);
      return {
        success: false,
        data: {},
        method: 'failed',
        confidence: 'low',
        rawInput: input,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Test extraction without saving (for debugging)
   */
  async testExtraction(input: string): Promise<void> {
    console.log('\n🧪 Testing Natural Language Extraction\n');
    console.log('Input:', input);
    console.log('='.repeat(60));

    const result = await this.extract(input);

    console.log('\n📊 Result:');
    console.log('Success:', result.success);
    console.log('Method:', result.method);
    console.log('Confidence:', result.confidence);
    console.log('\n📋 Extracted Data:');
    console.log(JSON.stringify(result.data, null, 2));

    if (result.errors) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => console.log(' ', err));
    }

    console.log('\n' + '='.repeat(60));
  }
}
