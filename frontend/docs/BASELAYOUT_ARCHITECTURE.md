# BaseLayout Architecture Flow

## Component Structure

```text
┌─────────────────────────────────────────────────────────────┐
│                      BaseLayout Component                    │
│  (frontend/src/components/BaseLayout.tsx)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Fixed Background Layer (z-0)                       │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Background Image (/background-image.png)     │  │    │
│  │  │  - opacity-60                                  │  │    │
│  │  │  - object-cover                                │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Dark Overlay (bg-zinc-950/70)                │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Cosmic Gradients (based on gradientVariant)  │  │    │
│  │  │  - Top right blur                              │  │    │
│  │  │  - Bottom left blur                            │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Header (z-10, relative)                            │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Logo  │  Title + Subtitle  │  Header Actions │  │    │
│  │  │  🔷    │  (optional)         │  (Settings ⚙️) │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │  - Sticky/Fixed                                     │    │
│  │  - Backdrop blur                                    │    │
│  │  - Border bottom                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Main Content Area (z-10, relative)                 │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  {children}                                    │  │    │
│  │  │  - Your custom page content goes here         │  │    │
│  │  │  - Stats, cards, tables, forms, etc.          │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```text
┌──────────────────┐
│   Your Page      │
│   (page.tsx)     │
└────────┬─────────┘
         │
         │ Passes props:
         │ - title
         │ - subtitle
         │ - gradientVariant
         │ - headerActions
         │ - children
         │
         ▼
┌──────────────────┐
│   BaseLayout     │
│   Component      │
├──────────────────┤
│                  │
│  Renders:        │
│  1. Background   │◄─── Uses /background-image.png
│  2. Gradients    │◄─── Based on gradientVariant
│  3. Header       │◄─── Logo + title + actions
│  4. Children     │◄─── Your page content
│                  │
└──────────────────┘
```

## Props to Styling Flow

```text
gradientVariant="blue"
    │
    ▼
┌─────────────────────┐
│ Gradient Config     │
│ blue: {             │
│   title: "from-     │
│     blue-400        │
│     to-cyan-400"    │
│   bg1: "bg-blue-    │
│     500/30"         │
│   bg2: "bg-cyan-    │
│     500/20"         │
│ }                   │
└──────┬──────────────┘
       │
       ├──> Applied to Title
       │    (gradient text)
       │
       ├──> Applied to BG Overlay 1
       │    (top-right blur)
       │
       └──> Applied to BG Overlay 2
            (bottom-left blur)
```

## Replication Workflow

```text
┌─────────────────────────────────────────────────┐
│  Step 1: Create New Page File                   │
│  frontend/src/app/[section]/page.tsx            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 2: Add Required Imports                   │
│  - "use client"                                  │
│  - BaseLayout                                    │
│  - UI components (Button, Card, etc.)           │
│  - Icons (lucide-react)                          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 3: Choose Gradient Variant                │
│  - Creator = "blue"                              │
│  - Node = "cyan"                                 │
│  - Admin = "purple"                              │
│  - Special = "green"                             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 4: Wrap Content with BaseLayout           │
│  <BaseLayout                                     │
│    title="..."                                   │
│    subtitle="..."                                │
│    gradientVariant="..."                         │
│  >                                               │
│    <div className="container mx-auto px-6 py-8">│
│      {/* Your content */}                        │
│    </div>                                        │
│  </BaseLayout>                                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 5: Use Consistent Styling                 │
│  - Cards: bg-zinc-900/80 backdrop-blur-sm       │
│  - Text: text-slate-200/300/400                  │
│  - Borders: border-zinc-800                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 6: Test Responsiveness                    │
│  - Mobile (< 640px)                              │
│  - Tablet (640-1024px)                           │
│  - Desktop (> 1024px)                            │
└─────────────────────────────────────────────────┘
```

## Example Page Structures

### Creator Dashboard

```text
BaseLayout (gradientVariant="blue")
└── container
    ├── Stats Grid (4 cards)
    ├── Action Bar (tabs + button)
    └── Jobs List (cards with progress)
```

### Node Dashboard

```text
BaseLayout (gradientVariant="cyan")
└── container
    ├── Stats Grid (4 cards)
    ├── Status Badge (Online/Offline)
    ├── Navigation Tabs
    └── Jobs Grid (available/active/completed)
```

### Admin Dashboard

```text
BaseLayout (gradientVariant="purple")
└── container
    ├── Stats Grid (4 cards with trends)
    ├── Quick Actions Sidebar
    └── Activity Feed / Disputes List
```

## Color Theme Mapping

```text
Role/Purpose          Gradient        Primary      Secondary
─────────────────────────────────────────────────────────────
Creator              blue            #4A90E2      #2ED2C9
Node                 cyan            #2ED2C9      #6B46C1
Admin                purple          #6B46C1      #4A90E2
Success/Achievement  green           #10B981      #2ED2C9
```

## File Dependencies

```text
BaseLayout.tsx
├── Imports
│   ├── react (ReactNode)
│   ├── next/link (Link)
│   ├── next/image (Image)
│   ├── @/components/ui/button (Button)
│   └── lucide-react (Icons)
│
├── Assets
│   └── /public/background-image.png
│
└── Used By
    ├── dashboard/creators/page.tsx
    ├── dashboard/nodes/page.tsx
    ├── dashboard/admin/page.tsx
    └── [any future dashboard pages]
```

## Z-Index Layers

```text
Layer 3 (z-20)  │  Mobile Menu Toggle
Layer 2 (z-10)  │  Header + Main Content
Layer 1 (z-1)   │  Cosmic Gradient Overlays
Layer 0 (z-0)   │  Background Image + Dark Overlay
```

## Responsive Breakpoints

```text
Mobile          │  < 640px   │  - Title below logo
                │            │  - Single column stats
                │            │  - Stacked buttons
─────────────────────────────────────────────────
Tablet          │  640-1024  │  - Title in header
                │            │  - 2 column stats
                │            │  - Flexible buttons
─────────────────────────────────────────────────
Desktop         │  > 1024px  │  - Full header layout
                │            │  - 4 column stats
                │            │  - Horizontal buttons
```

## Summary

### BaseLayout = Background + Header + Content Wrapper

- ✅ Reusable across all dashboard pages
- ✅ Consistent branding and styling
- ✅ Customizable per role/purpose
- ✅ Mobile responsive
- ✅ Easy to maintain

**Key Files:**

- Component: `frontend/src/components/BaseLayout.tsx`
- Full Guide: `frontend/docs/BASELAYOUT_GUIDE.md`
- Quick Ref: `frontend/docs/BASELAYOUT_QUICKREF.md`
- Architecture: `frontend/docs/BASELAYOUT_ARCHITECTURE.md` (this file)
