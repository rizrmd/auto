/**
 * Blog Prompt Builder
 *
 * Builds AI prompts for blog content generation in Indonesian language.
 * Optimized for automotive content with SEO best practices.
 */

import type { BlogCategory, AITone } from '../types/blog';

/**
 * Category display names in Indonesian
 */
const CATEGORY_NAMES: Record<BlogCategory, string> = {
  tips_mobil: 'Tips & Trik Mobil',
  berita_otomotif: 'Berita Otomotif',
  panduan_beli: 'Panduan Membeli Mobil',
  perawatan: 'Perawatan Kendaraan',
  review_mobil: 'Review Mobil',
  promo: 'Promo & Penawaran',
};

/**
 * Tone instructions in Indonesian
 */
const TONE_INSTRUCTIONS: Record<AITone, string> = {
  professional:
    'Gunakan nada profesional dan formal seperti artikel jurnalistik otomotif. Hindari bahasa gaul, gunakan istilah teknis yang tepat.',
  casual:
    'Gunakan nada santai dan ramah seperti berbicara dengan teman. Boleh gunakan bahasa sehari-hari dan sedikit humor.',
  balanced:
    'Gunakan nada seimbang antara profesional dan ramah. Informatif namun tetap mudah dipahami pembaca awam.',
  custom:
    '', // Will be filled with customToneInstructions
};

/**
 * Car information interface
 */
interface CarInfo {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: string;
  displayCode: string;
  keyFeatures: string[];
}

/**
 * Context for blog generation
 */
interface BlogPromptContext {
  tenantName: string;
  userPrompt: string;
  category: BlogCategory;
  availableCars?: CarInfo[];
  keywords?: string[];
  tone: AITone;
  customToneInstructions?: string;
}

/**
 * Build main blog generation prompt
 */
export function buildBlogPrompt(context: BlogPromptContext): string {
  const {
    tenantName,
    userPrompt,
    category,
    availableCars = [],
    keywords = [],
    tone,
    customToneInstructions,
  } = context;

  const categoryName = CATEGORY_NAMES[category];
  const toneInstruction =
    tone === 'custom' && customToneInstructions
      ? customToneInstructions
      : TONE_INSTRUCTIONS[tone];

  // Build car context if available
  let carContext = '';
  if (availableCars.length > 0) {
    carContext = `\n\n**Mobil yang Tersedia di Showroom:**\n`;
    availableCars.forEach((car) => {
      carContext += `- ${car.brand} ${car.model} ${car.year} (${car.displayCode}) - Rp ${car.price}\n`;
      if (car.keyFeatures.length > 0) {
        carContext += `  Fitur: ${car.keyFeatures.join(', ')}\n`;
      }
    });
  }

  // Build keywords context
  let keywordContext = '';
  if (keywords.length > 0) {
    keywordContext = `\n\n**Kata Kunci Penting:** ${keywords.join(', ')}`;
  }

  const prompt = `Kamu adalah penulis konten otomotif profesional untuk ${tenantName}, dealer mobil bekas berkualitas di Indonesia.

**Tugas:** Buat artikel blog dalam bahasa Indonesia untuk kategori "${categoryName}".

**Permintaan Pengguna:** ${userPrompt}

**Nada Penulisan:** ${toneInstruction}
${carContext}${keywordContext}

**Panduan Penulisan:**
1. **Panjang Artikel:** 800-1500 kata
2. **Struktur:**
   - Judul menarik dan SEO-friendly (maksimal 60 karakter)
   - Paragraf pembuka yang menarik perhatian
   - Gunakan heading (##, ###) untuk struktur yang jelas
   - Bagi konten menjadi sub-bagian yang mudah dibaca
   - Sertakan kesimpulan yang kuat

3. **Format Konten:**
   - Gunakan Markdown untuk formatting
   - Gunakan bullet points dan numbered lists untuk daftar
   - Bold untuk poin penting
   - Sertakan emoji yang relevan (jangan berlebihan)

4. **SEO Best Practices:**
   - Masukkan kata kunci secara natural (jangan keyword stuffing)
   - Gunakan LSI keywords (variasi kata kunci)
   - Buat meta description yang menarik (maksimal 160 karakter)
   - Sertakan internal call-to-action ke mobil yang tersedia

5. **Tone & Style:**
   - Tulis untuk pembaca Indonesia
   - Hindari terjemahan kaku dari bahasa Inggris
   - Gunakan contoh dan analogi lokal
   - Sertakan tips praktis dan actionable

6. **Jika Review/Tips Mobil:**
   - Referensikan mobil yang tersedia di showroom (jika relevan)
   - Berikan perbandingan objektif
   - Fokus pada value for money
   - Sertakan tips pembelian mobil bekas

7. **Call-to-Action:**
   - Ajak pembaca mengunjungi showroom atau menghubungi WhatsApp
   - Natural, tidak terlalu salesy

**Output Format (JSON):**
{
  "title": "Judul artikel (60 karakter max)",
  "excerpt": "Ringkasan menarik untuk preview (150-200 kata)",
  "content": "Konten artikel lengkap dalam Markdown (800-1500 kata)",
  "metaTitle": "SEO meta title (55-60 karakter)",
  "metaDescription": "SEO meta description (150-160 karakter)",
  "metaKeywords": ["keyword1", "keyword2", "keyword3", ...],
  "tags": ["tag1", "tag2", "tag3", ...],
  "suggestedCarIds": [1, 2, 3]
}

**Catatan Penting:**
- WAJIB return valid JSON
- Content dalam Markdown format
- Jangan gunakan placeholder, buat konten lengkap
- Sesuaikan dengan permintaan pengguna
- Fokus pada value untuk pembaca
- SEO-optimized tapi tetap natural untuk dibaca

Mulai buat artikel sekarang!`;

  return prompt;
}

/**
 * Build SEO optimization prompt
 */
export function buildSEOPrompt(title: string, content: string): string {
  const prompt = `Kamu adalah SEO specialist untuk konten otomotif Indonesia.

**Tugas:** Optimasi SEO untuk artikel blog berikut.

**Judul:** ${title}

**Konten:**
${content.substring(0, 1000)}... (dipotong untuk prompt)

**Generate:**
1. **Meta Title** (55-60 karakter):
   - Menarik untuk diklik
   - Mengandung keyword utama
   - Jelas dan deskriptif

2. **Meta Description** (150-160 karakter):
   - Ringkasan yang menarik
   - Mengandung keyword
   - Call-to-action natural
   - Membuat orang ingin klik

3. **Meta Keywords** (5-10 keywords):
   - Keyword utama dan variasi
   - LSI keywords
   - Long-tail keywords
   - Relevan dengan konten

4. **Suggested Tags** (3-7 tags):
   - Kategori konten
   - Topik utama
   - Untuk internal tagging

**Output Format (JSON):**
{
  "metaTitle": "SEO optimized title",
  "metaDescription": "SEO optimized description",
  "metaKeywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...]
}

Return valid JSON only!`;

  return prompt;
}

/**
 * Detect car mentions in content
 */
export function buildCarDetectionPrompt(content: string, availableCars: CarInfo[]): string {
  const carList = availableCars
    .map((car) => `ID ${car.id}: ${car.brand} ${car.model} ${car.year} (${car.displayCode})`)
    .join('\n');

  const prompt = `Analisis konten artikel berikut dan identifikasi mobil mana saja yang disebutkan atau direferensikan.

**Konten:**
${content.substring(0, 2000)}... (dipotong)

**Daftar Mobil yang Tersedia:**
${carList}

**Tugas:**
1. Identifikasi mobil mana saja yang disebutkan dalam artikel
2. Bisa berdasarkan:
   - Brand dan model disebutkan langsung
   - Karakteristik yang cocok dengan mobil tertentu
   - Konteks pembahasan yang relevan

**Output Format (JSON):**
{
  "detectedCarIds": [1, 5, 12],
  "reasoning": "Penjelasan singkat mengapa mobil tersebut dipilih"
}

Return valid JSON only!`;

  return prompt;
}

/**
 * Build excerpt generation prompt (if not provided)
 */
export function buildExcerptPrompt(title: string, content: string): string {
  const prompt = `Buat excerpt menarik untuk artikel blog berikut.

**Judul:** ${title}

**Konten:**
${content.substring(0, 1500)}... (dipotong)

**Requirements:**
- Panjang: 150-200 kata
- Ringkas isi artikel
- Menarik pembaca untuk baca lebih lanjut
- Bahasa Indonesia yang natural
- Highlight poin-poin menarik
- Tidak spoiler semua isi

**Output:** Return excerpt text saja (tidak perlu JSON), maksimal 200 kata.`;

  return prompt;
}

/**
 * Helper: Parse JSON response from AI
 */
export function parseAIResponse<T>(response: string): T {
  try {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('[BLOG AI] Failed to parse AI response:', error);
    console.error('[BLOG AI] Response:', response.substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Category writing guidelines
 */
export const CATEGORY_GUIDELINES: Record<BlogCategory, string> = {
  tips_mobil:
    'Berikan tips praktis dan actionable. Gunakan step-by-step jika memungkinkan. Fokus pada solusi masalah umum pemilik mobil.',
  berita_otomotif:
    'Update terkini dunia otomotif. Objektif dan informatif. Sertakan implikasi untuk pembeli mobil bekas.',
  panduan_beli:
    'Panduan lengkap untuk calon pembeli. Fokus pada edukasi, checklist, dan tips menghindari penipuan. Bangun kepercayaan.',
  perawatan:
    'Tips perawatan yang mudah dipraktikkan. Jelaskan why dan how. Sertakan estimasi biaya jika relevan.',
  review_mobil:
    'Review objektif dan seimbang. Highlight kelebihan dan kekurangan. Bandingkan dengan kompetitor. Fokus pada value.',
  promo:
    'Informasi promo yang menarik. Highlight benefit untuk pembeli. Sertakan terms & conditions. Call-to-action jelas.',
};
