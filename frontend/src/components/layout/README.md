# HeroHeader Component

## Overview

`HeroHeader` is a customizable hero section component that supports tenant-specific branding and content. It provides responsive design, accessibility features, and fallback values for maximum compatibility.

## Features

- ✅ **Tenant Customization**: Supports dynamic content based on tenant data
- ✅ **Responsive Design**: Optimized for mobile, tablet, and desktop
- ✅ **Accessibility**: Proper ARIA labels and semantic HTML
- ✅ **Fallback Values**: Graceful degradation when tenant data is missing
- ✅ **Smart Highlighting**: Automatically highlights emotional/dream words in titles
- ✅ **Color Theming**: Uses tenant's primary and secondary colors
- ✅ **WhatsApp Integration**: Built-in WhatsApp button with fallback handling

## Props

```typescript
interface HeroHeaderProps {
  onBrowseAll?: (e: React.MouseEvent) => void; // Custom handler for browse all button
  onWhatsAppClick?: (e: React.MouseEvent) => void; // Custom handler for WhatsApp button
  className?: string; // Additional CSS classes
  showWhatsApp?: boolean; // Whether to show WhatsApp button (default: true)
}
```

## Tenant Data Integration

The component uses the following tenant fields:

```typescript
interface Tenant {
  // ... other fields
  headerTagline?: string;        // Example: "Mobil Bekas Berkualitas"
  headerTitle?: string;          // Example: "Temukan Mobil Impian Kamu"
  headerSubtitle?: string;       // Example: "Jelajahi koleksi mobil bekas..."
  headerCtaText?: string;        // Example: "Lihat Semua Mobil"
  primaryColor?: string;         // For button and decoration colors
  secondaryColor?: string;       // For secondary button colors
  whatsappNumber?: string;       // For WhatsApp integration
}
```

## Fallback Values

When tenant data is not available, the component uses these defaults:

- **Tagline**: "Mobil Bekas Berkualitas"
- **Title**: "Temukan Mobil Impian Kamu"
- **Subtitle**: "Jelajahi koleksi mobil bekas pilihan kami. Kualitas terjamin, harga terpercaya, dan pelayanan terbaik."
- **CTA Text**: "Lihat Semua Mobil"

## Usage Examples

### Basic Usage

```tsx
import { HeroHeader } from '../components/layout/HeroHeader';

function MyPage() {
  const handleBrowseAll = (e) => {
    e.preventDefault();
    // Custom navigation logic
    window.location.href = '/cars';
  };

  return (
    <HeroHeader
      onBrowseAll={handleBrowseAll}
      showWhatsApp={true}
    />
  );
}
```

### With Custom Styling

```tsx
<HeroHeader
  className="my-custom-class"
  onBrowseAll={customHandler}
  showWhatsApp={false}
/>
```

### Integration with HomePage

```tsx
// In HomePage.tsx
import { HeroHeader } from '../components/layout/HeroHeader';

export function HomePage() {
  const { tenant } = useTenantContext();

  const handleBrowseAll = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/cars';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeroHeader
        onBrowseAll={handleBrowseAll}
        showWhatsApp={!!tenant?.whatsappNumber}
      />
      {/* Rest of the page */}
    </div>
  );
}
```

## Responsive Breakpoints

- **Mobile**: < 640px (sm)
  - Padding: py-16
  - Title: text-3xl
  - Tagline: text-xs
  - Buttons: Full width

- **Tablet**: 640px - 1024px (md-lg)
  - Padding: py-20 to py-32
  - Title: text-4xl to text-5xl
  - Tagline: text-sm
  - Buttons: Auto width with flex layout

- **Desktop**: > 1024px (xl)
  - Padding: py-40
  - Title: text-6xl to text-7xl
  - Optimized spacing and sizing

## Accessibility Features

- ✅ Semantic HTML structure with `<section>` and `<h1>`
- ✅ ARIA labels for buttons and interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader friendly content structure
- ✅ Proper heading hierarchy
- ✅ Focus states for interactive elements

## Smart Title Highlighting

The component automatically highlights emotional/dream words in the title:

```typescript
const highlightWords = ['impian', 'idaman', 'dream', 'perfect'];
```

Examples:
- "Temukan Mobil **Impian** Kamu" → "Impian" highlighted
- "Find Your **Dream** Car" → "Dream" highlighted
- "Mobil **Idaman** Keluarga" → "Idaman" highlighted

## Color Customization

Colors are applied using inline styles for tenant-specific theming:

```tsx
style={{
  backgroundColor: tenant?.primaryColor || undefined,
  borderColor: tenant?.primaryColor || undefined,
}}
```

Decorative elements also use tenant colors with opacity variations.

## Integration Notes

1. **TenantContext**: Ensure the component is wrapped in `TenantProvider`
2. **Routing**: Default handlers use `window.location.href` for navigation
3. **WhatsApp**: Phone number validation and cleaning is built-in
4. **Performance**: Minimal re-renders with efficient memoization

## File Structure

```
frontend/src/
├── components/layout/
│   ├── HeroHeader.tsx       # Main component
│   └── README.md           # This documentation
├── api/
│   └── cars.ts            # Updated Tenant interface
├── context/
│   └── TenantContext.tsx  # Tenant data provider
└── pages/
    └── HomePage.tsx       # Updated usage example
```

## Backend Integration

To use the header customization features, ensure your backend provides these fields in the tenant data:

```sql
-- Example database schema
ALTER TABLE tenants
ADD COLUMN header_tagline VARCHAR(255),
ADD COLUMN header_title VARCHAR(255),
ADD COLUMN header_subtitle TEXT,
ADD COLUMN header_cta_text VARCHAR(255);
```

## Testing

The component includes comprehensive fallback handling:

1. **Empty/Null Data**: Falls back to default values
2. **Missing Tenant**: Shows default content with neutral styling
3. **Invalid Colors**: Uses system default colors
4. **Missing WhatsApp**: Hides WhatsApp button gracefully

## Browser Compatibility

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile Safari/Chrome
- ✅ Progressive enhancement for older browsers