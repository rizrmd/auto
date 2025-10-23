# Premium Car Catalog - Visual Component Guide

## HomePage Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header (with tenant logo, search bar, navigation)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         HERO SECTION                                  │ │
│  │  Find Your Perfect Dream Car                          │ │
│  │  [Browse All Cars] [Contact Us]                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         FEATURES (3 columns)                          │ │
│  │  [Quality]    [Best Prices]    [Wide Selection]       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Featured Cars                            [View All →]     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
│  │  Car    │  │  Car    │  │  Car    │                   │
│  │  Card   │  │  Card   │  │  Card   │                   │
│  │  #A01   │  │  #A02   │  │  #A03   │                   │
│  └─────────┘  └─────────┘  └─────────┘                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
│  │  Car    │  │  Car    │  │  Car    │                   │
│  │  Card   │  │  Card   │  │  Card   │                   │
│  │  #A04   │  │  #A05   │  │  #A06   │                   │
│  └─────────┘  └─────────┘  └─────────┘                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         CTA SECTION                                   │ │
│  │  Ready to Find Your Dream Car?                        │ │
│  │  [Browse All Cars]                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Footer (contact info, location, business hours)            │
└─────────────────────────────────────────────────────────────┘
```

## CarListingPage Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header (with search bar)                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browse Cars                                               │
│  24 cars available                                         │
│                                                             │
│  ┌──────────┐  ┌───────────────────────────────────────┐  │
│  │          │  │ [Mobile: Filter Button]               │  │
│  │ FILTERS  │  │                                        │  │
│  │          │  │ ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │ Sort By  │  │ │  Car    │  │  Car    │  │  Car    │ │  │
│  │ Brand    │  │ │  Card   │  │  Card   │  │  Card   │ │  │
│  │ Trans.   │  │ │  #A01   │  │  #A02   │  │  #A03   │ │  │
│  │ Year     │  │ └─────────┘  └─────────┘  └─────────┘ │  │
│  │ Price    │  │                                        │  │
│  │          │  │ ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │ [Clear]  │  │ │  Car    │  │  Car    │  │  Car    │ │  │
│  │          │  │ │  Card   │  │  Card   │  │  Card   │ │  │
│  └──────────┘  │ │  #A04   │  │  #A05   │  │  #A06   │ │  │
│                │ └─────────┘  └─────────┘  └─────────┘ │  │
│                │                                        │  │
│                │         ... more cars ...              │  │
│                │                                        │  │
│                │ ┌────────────────────────────────────┐ │  │
│                │ │  Pagination: [<] 1 2 3 ... 8 [>]  │ │  │
│                │ └────────────────────────────────────┘ │  │
│                └────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

## CarDetailPage Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header (minimal, no search)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [← Back]                                                   │
│                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────┐   │
│  │                              │  │                  │   │
│  │  ┌────────────────────────┐  │  │  Interested?     │   │
│  │  │   MAIN PHOTO           │  │  │                  │   │
│  │  │   (Gallery)            │  │  │  Contact us for  │   │
│  │  │   [1/5]  [SOLD badge]  │  │  │  more info...    │   │
│  │  └────────────────────────┘  │  │                  │   │
│  │                              │  │  [WhatsApp CTA]  │   │
│  │  [thumb] [thumb] [thumb]...  │  │                  │   │
│  │                              │  │  • Quick reply   │   │
│  ├──────────────────────────────┤  │  • Pro service   │   │
│  │                              │  └──────────────────┘   │
│  │  Toyota Avanza 2020          │                         │
│  │  2020 • Hitam • #A01         │                         │
│  │  [AVAILABLE]                 │                         │
│  │                              │                         │
│  │  Rp 180.000.000             │                         │
│  │                              │                         │
│  │  [2020] [45k km] [Matic]     │                         │
│  │                              │                         │
│  │  [Share] [Save]              │                         │
│  ├──────────────────────────────┤                         │
│  │                              │                         │
│  │  Description                 │                         │
│  │  Mobil terawat, service...   │                         │
│  ├──────────────────────────────┤                         │
│  │                              │                         │
│  │  Specifications              │                         │
│  │  [Year][KM][Trans][Color]... │                         │
│  ├──────────────────────────────┤                         │
│  │                              │                         │
│  │  Key Features                │                         │
│  │  ✓ Velg Racing              │                         │
│  │  ✓ Audio Premium            │                         │
│  │  ✓ Camera Parkir            │                         │
│  └──────────────────────────────┘                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
├─────────────────────────────────────────────────────────────┤
│ [Sticky WhatsApp Button] 💬 Chat via WhatsApp             │
└─────────────────────────────────────────────────────────────┘
```

## CarCard Component Detail

```
┌───────────────────────────────────┐
│  [#A01 badge]    [SOLD badge]     │  ← Status badges
│                                   │
│  ┌─────────────────────────────┐  │
│  │                             │  │
│  │     CAR IMAGE               │  │  ← Hover: scale up
│  │     (aspect 4:3)            │  │
│  │                             │  │
│  └─────────────────────────────┘  │  ← Gradient overlay
│                                   │
│  Toyota Avanza                    │  ← Brand + Model
│  2020 • Hitam                     │  ← Year + Color
│                                   │
│  Rp 180.000.000                   │  ← Price (large)
│                                   │
│  ├─────────────┬────────────────┤ │
│  │ 45.000 km   │ Matic          │ │  ← Quick specs
│  └─────────────┴────────────────┘ │
│                                   │
│  [Velg Racing] [Audio +1]         │  ← Feature badges
│                                   │
└───────────────────────────────────┘
```

## CarGallery Component Detail

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐  │
│  │ [<]      MAIN IMAGE      [>]  │  │  ← Nav arrows
│  │                          1/5  │  │  ← Counter
│  └───────────────────────────────┘  │
│                                     │
│  [img] [img] [img] [img] [img]     │  ← Thumbnails
│   ^active                           │
│                                     │
└─────────────────────────────────────┘

On Click → Fullscreen Mode:
┌─────────────────────────────────────┐
│ [X]                                 │  ← Close button
│                                     │
│  [<]     FULLSCREEN IMAGE      [>]  │
│                                     │
│            1 / 5                    │  ← Counter
└─────────────────────────────────────┘
```

## SearchBar Component Detail

```
┌─────────────────────────────────────┐
│ 🔍 Search by brand, model...    [X] │  ← Input with clear
└─────────────────────────────────────┘
        ↓ (typing "toyota")
┌─────────────────────────────────────┐
│ 🔍 toyota                       [X] │
├─────────────────────────────────────┤
│ ┌─────┐                            │
│ │ img │ Toyota Avanza 2020         │  ← Autocomplete
│ │     │ 2020 • 45k km • Matic      │     results
│ │     │ Rp 180.000.000             │
│ └─────┘                            │
├─────────────────────────────────────┤
│ ┌─────┐                            │
│ │ img │ Toyota Fortuner 2021       │
│ │     │ 2021 • 20k km • Matic      │
│ │     │ Rp 450.000.000             │
│ └─────┘                            │
└─────────────────────────────────────┘
```

## CarFilters Component Detail

### Desktop (Sidebar):
```
┌──────────────────┐
│ Filters [Active] │
├──────────────────┤
│                  │
│ Sort By          │
│ [Newest ▼]       │
│                  │
│ Brand            │
│ [All Brands ▼]   │
│                  │
│ Transmission     │
│ [All ▼]          │
│                  │
│ Year Range       │
│ [Min ▼] [Max ▼]  │
│                  │
│ Price Range      │
│ [Min ▼] [Max ▼]  │
│                  │
│ [Clear Filters]  │
└──────────────────┘
```

### Mobile (Modal):
```
┌─────────────────────────────┐
│ Filters            [X]      │
├─────────────────────────────┤
│                             │
│ Sort By                     │
│ [Newest ▼]                  │
│                             │
│ Brand                       │
│ [All Brands ▼]              │
│                             │
│ ... (same fields) ...       │
│                             │
│ [Clear Filters]             │
│                             │
│ [Show Results]              │
└─────────────────────────────┘
```

## Mobile Interactions

### Swipe Gestures:
- **Gallery**: Swipe left/right to change photos
- **Cards**: Tap to view details
- **Filters**: Slide up from bottom

### Touch Targets:
- Minimum 44x44px for all buttons
- Large tap areas on cards
- Sticky WhatsApp button (60px)

### Responsive Breakpoints:
```
Mobile:   < 640px  (1 column)
Tablet:   640-1024px (2 columns)
Desktop:  > 1024px (3 columns + sidebar)
```

## Color System Visualization

```
Primary Color (from tenant):
┌───────┐
│       │  Used for:
│  🎨   │  - Buttons
│       │  - Links
└───────┘  - Badges
           - Accents

Secondary Color (from tenant):
┌───────┐
│       │  Used for:
│  🎨   │  - Text
│       │  - Borders
└───────┘  - Shadows

Background Colors:
┌───────┐ White/Light
│       │ Card backgrounds
└───────┘

┌───────┐ Muted
│       │ Hover states
└───────┘ Subtle backgrounds
```

## Animation Examples

### Hover Effects:
```
Card:
  Normal → Hover
  [Card] → [Card ↑] + Shadow

Button:
  Normal → Hover
  [Button] → [Button] + Brightness

Image:
  Normal → Hover
  [Image] → [Image 1.1x scale]
```

### Loading States:
```
Skeleton:
┌─────────────────┐
│ ████████░░░░░░░ │ ← Animated shine
│ ██████░░░░░░░░░ │
│ ████████████░░░ │
└─────────────────┘
```

### Transitions:
- Fade in: 200ms
- Slide up: 300ms
- Scale: 300ms
- Color change: 200ms

## Accessibility Features

### Keyboard Navigation:
```
Tab Order:
1. Search bar
2. Filter buttons
3. Car cards (grid)
4. Pagination
5. Footer links
```

### Screen Reader:
- ARIA labels on all interactive elements
- Semantic HTML (header, main, nav, footer)
- Alt text on all images
- Form labels properly associated

### Color Contrast:
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

## Component Composition Example

```tsx
<TenantProvider>
  <HomePage>
    <Header>
      <SearchBar />
    </Header>

    <main>
      <HeroSection />
      <FeaturesSection />

      <section>
        <h2>Featured Cars</h2>
        <CarGrid>
          <CarCard car={car1} />
          <CarCard car={car2} />
          <CarCard car={car3} />
        </CarGrid>
      </section>
    </main>

    <Footer />
  </HomePage>
</TenantProvider>
```

This visual guide provides a clear understanding of how all components look and work together in the premium car catalog UI.
