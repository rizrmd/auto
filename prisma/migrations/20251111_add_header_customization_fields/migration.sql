-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "header_tagline" VARCHAR(200) DEFAULT 'Mobil Bekas Berkualitas',
ADD COLUMN     "header_title" VARCHAR(200) NOT NULL DEFAULT 'Temukan Mobil Impian Kamu',
ADD COLUMN     "header_subtitle" TEXT NOT NULL DEFAULT 'Jelajahi koleksi mobil bekas pilihan kami. Kualitas terjamin, harga terpercaya, dan pelayanan terbaik.',
ADD COLUMN     "header_cta_text" VARCHAR(100) NOT NULL DEFAULT 'Lihat Semua Mobil';