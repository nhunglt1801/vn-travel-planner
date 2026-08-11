# Design System Inspired by Wanderlog

## 1. Visual Theme & Atmosphere

Wanderlog's design system embodies a modern, approachable travel planning experience with warmth and clarity at its core. The visual identity balances professional functionality with friendly accessibility, featuring a vibrant coral-red accent that conveys energy and adventure alongside a grounded neutral palette. The design prioritizes clear information hierarchy and seamless interaction, reflecting the app's mission to simplify complex travel logistics. Generous whitespace, soft shadows, and rounded corners create an inviting atmosphere that feels personal rather than corporate, making travel planning feel less overwhelming and more inspiring.

**Key Characteristics**
- Warm, energetic accent colors contrasting cool-toned neutrals
- Clean, modern typography hierarchy with consistent weight choices
- Rounded elements and soft edges for approachability
- Functional use of color for status and semantic meaning
- Emphasis on clarity and usability over ornamentation
- Generous spacing supports rapid scanning and interaction
- Soft shadows and subtle elevation create depth without visual noise

## 2. Color Palette & Roles

### Primary
- **Dark Charcoal** (`#212529`): Primary text, headings, and UI elements throughout the interface; highest contrast for readability
- **Coral Red** (`#F75940`): Primary call-to-action buttons, key interactive elements, and brand accent; drives user engagement

### Accent Colors
- **Deep Blue** (`#3F52E3`): Secondary interactive states, links, and accent highlights; adds visual variety and supports primary coral
- **Medium Rose** (`#E23E57`): Alternative accent for selected states or secondary emphasis; complements coral

### Interactive
- **Success Green** (`#17B978`): Positive confirmations, completed states, and success messaging
- **Status Cyan** (`#17A2B8`): Informational states and secondary status indicators
- **Danger Red** (`#FF253A`): Error states and critical alerts requiring immediate attention
- **Warning Orange** (`#EC9B3B`): Warning messages and caution indicators

### Neutral Scale
- **Off-White** (`#FFFFFF`): Primary background for cards, containers, and modal surfaces
- **Light Gray 1** (`#F3F4F5`): Subtle background tints for secondary surfaces
- **Light Gray 2** (`#E9ECEF`): Tertiary backgrounds and disabled states
- **Light Gray 3** (`#EEEEEE`): Section dividers and subtle borders
- **Border Gray** (`#DEE2E6`): Input borders, card borders, and subtle separators
- **Medium Gray** (`#6C757D`): Secondary text, labels, and placeholder content
- **Dark Gray** (`#495057`): Tertiary text and muted content

### Surface & Borders
- **Pure White** (`#FFFFFF`): Primary card and container background
- **Surface Border** (`#DEE2E6`): Input fields and card borders; provides subtle separation
- **Pure Black** (`#000000`): Maximum contrast for critical hierarchy points

## 3. Typography Rules

### Font Family
**Primary:** Source Sans 3 (sans-serif stack: `"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)

**Secondary:** Source Sans 3 (unified system for consistency and clarity)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|------------|-----------------|-------|
| Display / H1 | Source Sans 3 | 48px | 700 | 57.6px | Normal | Hero headlines, page titles; maximum visual impact |
| Heading Large / H2 | Source Sans 3 | 36px | 700 | 43.2px | Normal | Section headers; strong hierarchy establishment |
| Heading Medium / H3 | Source Sans 3 | 24px | 400 | 28.8px | Normal | Subsection headers; balanced emphasis |
| Heading Small / H4 | Source Sans 3 | 16px | 700 | 24px | Normal | Card titles, component headers; bold accent |
| Heading Extra Small / H6 | Source Sans 3 | 14px | 700 | 21px | Normal | Form labels, button text; compact emphasis |
| Body / Paragraph | Source Sans 3 | 18px | 400 | 27px | Normal | Main content and descriptions; high legibility |
| Link / Navigation | Source Sans 3 | 20px | 700 | 20px | Normal | Primary navigation, call-to-action links |
| Button Text | Source Sans 3 | 16px | 400 | 24px | Normal | Button labels; readable at interactive scale |
| Caption / Small | Source Sans 3 | 14px | 400 | 21px | Normal | Supporting text, timestamps, fine print |

### Principles
- Consistent use of Source Sans 3 across all roles ensures unified, modern aesthetic
- Weight hierarchy (400 for body, 700 for emphasis) creates clear scanability
- Line heights set to 1.2× font size for comfortable reading
- H3 uses 400 weight intentionally to reduce visual weight compared to H2
- Body text at 18px supports accessibility and sustained reading
- Navigation and link scales prioritize prominence without overwhelming

## 4. Component Stylings

### Buttons

#### Primary Button (CTA)
- **Background:** `#F75940`
- **Text Color:** `#FFFFFF`
- **Font:** Source Sans 3, 16px, 400 weight, `24px` line-height
- **Padding:** `7px 16px`
- **Border Radius:** `20px`
- **Border:** `1px solid #F75940`
- **Height:** `32px`
- **Hover State:** Background `#E74A2F` (darkened 15%)
- **Active State:** Background `#D93D1F` (darkened 25%)
- **Disabled State:** Background `#DEE2E6`, Text Color `#6C757D`

#### Secondary Button
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#212529`
- **Font:** Source Sans 3, 14px, 700 weight, `21px` line-height
- **Padding:** `12px 8px`
- **Border Radius:** `8px`
- **Border:** `1px solid #DEE2E6`
- **Height:** `45px`
- **Hover State:** Background `#F3F4F5`, Text Color `#212529`
- **Active State:** Background `#E9ECEF`
- **Focus State:** Border `2px solid #3F52E3`

#### Ghost Button (Tertiary)
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#212529`
- **Font:** Source Sans 3, 16px, 400 weight, `24px` line-height
- **Padding:** `0px 8px`
- **Border Radius:** `0px`
- **Border:** None
- **Height:** `auto`
- **Hover State:** Text Color `#F75940`, underline decoration
- **Active State:** Text Color `#E74A2F`

#### Light/Inverse Button
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#FFFFFF`
- **Font:** Source Sans 3, 14px, 700 weight, `21px` line-height
- **Padding:** `0px`
- **Border Radius:** `0px`
- **Border:** None
- **Hover State:** Text Color `#F3F4F5`

### Cards & Containers

#### Standard Card
- **Background:** `#FFFFFF`
- **Text Color:** `#212529`
- **Border:** `1px solid #DEE2E6`
- **Border Radius:** `16px`
- **Padding:** `16px`
- **Box Shadow:** `rgba(0, 0, 0, 0.1) 0px 2px 4px 0px`
- **Font:** Source Sans 3, 16px, 400 weight, `24px` line-height
- **Min Height:** `214px`
- **Hover State:** Box Shadow `rgba(0, 0, 0, 0.176) 0px 8px 16px 0px`, slight scale 1.02

#### Overlay/Hero Card
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#212529`
- **Border:** None
- **Padding:** `0px`
- **Min Height:** `116px`
- **Hover State:** None (static content)

#### Secondary Content Card
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#6C757D`
- **Border:** None
- **Padding:** `0px`
- **Min Height:** `96px`
- **Font Size:** `16px`

### Inputs & Forms

#### Text Input Field
- **Background:** `#FFFFFF`
- **Text Color:** `#495057`
- **Font:** Source Sans 3, 16px, 400 weight, `24px` line-height
- **Padding:** `0px 16px 0px 48px` (left padding for icon)
- **Border:** `1px solid #DEE2E6`
- **Border Radius:** `8px`
- **Height:** `56px`
- **Width:** `100%` (flexible)
- **Placeholder Color:** `#6C757D`
- **Focus State:** Border `2px solid #3F52E3`, Box Shadow `0px 0px 0px 3px rgba(63, 82, 227, 0.1)`
- **Error State:** Border `2px solid #FF253A`, Box Shadow `0px 0px 0px 3px rgba(255, 37, 58, 0.1)`
- **Disabled State:** Background `#E9ECEF`, Border `1px solid #DEE2E6`, Text Color `#6C757D`

#### Search Input Field
- **Background:** `#FFFFFF`
- **Text Color:** `#495057`
- **Font:** Source Sans 3, 16px, 400 weight
- **Padding:** `0px 16px 0px 48px` (icon on left)
- **Border:** `1px solid #DEE2E6`
- **Border Radius:** `8px`
- **Height:** `56px`
- **Width:** `300px`
- **Placeholder:** "Explore by destination"
- **Placeholder Color:** `#6C757D`
- **Focus State:** Border `2px solid #3F52E3`

### Navigation

#### Top Navigation Bar
- **Background:** `#FFFFFF`
- **Text Color:** `#212529`
- **Font:** Source Sans 3, 16px, 400 weight, `24px` line-height
- **Height:** `64px`
- **Border Bottom:** `1px solid #DEE2E6`
- **Padding:** `0px 32px`
- **Box Shadow:** `rgba(0, 0, 0, 0.1) 0px 2px 4px 0px`

#### Navigation Links
- **Text Color:** `#212529`
- **Font:** Source Sans 3, 16px, 400 weight
- **Padding:** `20px 16px`
- **Hover State:** Text Color `#F75940`, Background `#F3F4F5`
- **Active State:** Text Color `#F75940`, Border Bottom `3px solid #F75940`

### Badges & Labels

#### Status Badge
- **Background:** `#F3F4F5`
- **Text Color:** `#212529`
- **Font:** Source Sans 3, 12px, 600 weight
- **Padding:** `4px 12px`
- **Border Radius:** `32px`
- **Height:** `24px`

#### Success Badge
- **Background:** `#E8F9F5`
- **Text Color:** `#17B978`
- **Border:** `1px solid #17B978`
- **Padding:** `4px 12px`
- **Border Radius:** `32px`

#### Warning Badge
- **Background:** `#FFF3E0`
- **Text Color:** `#EC9B3B`
- **Border:** `1px solid #EC9B3B`
- **Padding:** `4px 12px`
- **Border Radius:** `32px`

#### Error Badge
- **Background:** `#FFE8EC`
- **Text Color:** `#FF253A`
- **Border:** `1px solid #FF253A`
- **Padding:** `4px 12px`
- **Border Radius:** `32px`

### Tabs

#### Tab Container
- **Background:** `#FFFFFF`
- **Border Bottom:** `1px solid #DEE2E6`
- **Height:** `48px`

#### Tab Item (Inactive)
- **Text Color:** `#6C757D`
- **Font:** Source Sans 3, 16px, 400 weight
- **Padding:** `12px 24px`
- **Border Bottom:** None
- **Hover State:** Text Color `#212529`, Background `#F3F4F5`

#### Tab Item (Active)
- **Text Color:** `#F75940`
- **Font:** Source Sans 3, 16px, 400 weight
- **Border Bottom:** `3px solid #F75940`
- **Background:** `#FFFFFF`

## 5. Layout Principles

### Spacing System

**Base Unit:** `8px`

**Spacing Scale:**
- **xs:** `4px` — padding in compact controls, tight lists
- **sm:** `8px` — gap between inline elements, minimal padding
- **md:** `16px` — standard padding in cards, button spacing
- **lg:** `20px` — card internal padding, content margins
- **xl:** `32px` — section gaps, medium container margins
- **2xl:** `48px` — large section spacing, meaningful breaks
- **3xl:** `64px` — hero and major layout sections
- **4xl:** `80px` — padding on wide containers, major page sections
- **5xl:** `100px` — premium whitespace in hero areas
- **6xl:** `160px` — maximum padding on edge-aligned content

**Usage Context:**
- `4px` and `8px` for component internals (buttons, badges)
- `16px` for standard container padding and card spacing
- `20px` for form field and input padding
- `32px–48px` for section separation
- `64px–160px` for hero sections and major layout breaks

### Grid & Container

**Max Width:** `1440px` (navigation bar reference)

**Column Strategy:**
- Desktop: 12-column grid with `16px` gaps
- Tablet: 8-column grid with `16px` gaps
- Mobile: Single column with `16px` side margins

**Container Patterns:**
- Full-width hero sections with centered content container (max `1200px`)
- Two-column layouts (content + sidebar) with `32px` gap
- Card grids responsive: 4 columns desktop, 2 columns tablet, 1 column mobile
- Map/content split: 60% content, 40% map on desktop; stack on mobile

### Whitespace Philosophy

Wanderlog prioritizes generous whitespace to reduce cognitive load and support scanning. Spacing increases dramatically in hero sections (`64px–160px` padding) to create visual breathing room and highlight key calls-to-action. Content areas maintain consistent `32px` gaps between sections, while form controls and compact lists use `8px–16px` spacing. The design avoids stacking elements without clear visual separation, ensuring each component feels intentional and scannable.

### Border Radius Scale

- **Sharp (`0px`):** Text links, unstyled elements, native HTML behavior
- **Subtle (`8px`):** Input fields, small interactive elements, tabs
- **Rounded (`16px`):** Cards, containers, standard components
- **Very Rounded (`20px`):** Primary buttons, featured CTAs
- **Full Circle (`100px`):** Pill-shaped buttons, compact badges
- **Full Circle (`9999px`):** Avatar images, user profile photos

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, `box-shadow: none` | Links, text, flat buttons, disabled states |
| Raised (1) | `rgba(0, 0, 0, 0.1) 0px 2px 4px 0px` | Standard cards, subtle elevation for distinction |
| Lifted (2) | `rgba(0, 0, 0, 0.176) 0px 8px 16px 0px` | Dropdown menus, hover states on cards, secondary elevation |
| Floating (3) | `rgba(0, 0, 0, 0.2) 0px 4px 24px 0px` | Modals, popovers, critical overlays, maximum emphasis |

**Shadow Philosophy:**

Wanderlog uses subtle, restrained shadows to create depth without visual heaviness. The shadow system adheres to a two-level approach: minimal shadows for standard cards (level 1) and moderate shadows for interactive overlays (level 2–3). Shadows increase in blur radius and spread to convey elevation change, but opacity remains conservative (`0.1–0.2`) to maintain a light, modern aesthetic. Shadows are strictly reserved for functional elevation; purely decorative ornamentation is avoided. Dark elements and text never carry shadows, ensuring clarity and reducing visual noise.

## 7. Do's and Don'ts

### Do
- Use **`#F75940`** coral red for all primary calls-to-action and key interactive moments to maintain consistent affordance
- Apply generous whitespace (`32px–64px`) between major sections to guide attention and improve scannability
- Pair **`#212529`** dark charcoal text with **`#FFFFFF`** white backgrounds for optimal contrast and readability (21:1 ratio)
- Employ semantic colors for status: **`#17B978`** for success, **`#EC9B3B`** for warnings, **`#FF253A`** for errors
- Maintain consistent `16px` border radius on all cards and containers for cohesive visual language
- Use Source Sans 3 consistently across all text roles to preserve typographic unity
- Include `8px` top/bottom padding minimum on buttons and form controls for touch target adequacy
- Stack cards with `16px` gap and subtle box shadow (`rgba(0, 0, 0, 0.1) 0px 2px 4px 0px`) for visual separation
- Implement focus states with `2px` border in **`#3F52E3`** blue for keyboard navigation accessibility
- Test contrast ratios: aim for WCAG AA minimum (4.5:1 for body text, 3:1 for UI components)

### Don't
- Avoid using **`#495057`** medium gray text on **`#F3F4F5`** light gray backgrounds (insufficient contrast)
- Don't apply shadows to text elements or links; shadows are reserved for containers and overlays only
- Avoid nesting more than two levels of cards; flatten visual hierarchy when possible
- Don't use pure black (`#000000`) for body text; use **`#212529`** instead for softer, more readable appearance
- Avoid overusing the coral red accent; limit to CTAs, key interactions, and semantic highlights
- Don't mix border radius values on related components; maintain consistency (buttons 20px, cards 16px, inputs 8px)
- Avoid placing interactive elements without adequate padding; never undercut `8px` padding on buttons
- Don't create shadows with large spread distances; maximum blur `16px`, maximum spread `0px`
- Avoid introducing new colors outside the defined palette; extend existing semantic colors instead
- Don't implement hover states without corresponding focus states; ensure keyboard users receive equivalent feedback

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | `< 640px` | Single-column layout, full-width cards (`16px` margins), stacked navigation, `32px` section spacing, input width 100% |
| Tablet | `640px–1024px` | Two-column layouts, card grids 2 columns, `24px` margins, condensed navigation (nav items wrap), `32px` section spacing |
| Desktop | `1024px–1440px` | Three/four-column grids, two-column content layouts, full navigation, `32px` horizontal margins, `48px` section spacing |
| Wide | `≥ 1440px` | Constrained max-width container (`1200px` centered), four+ column grids, `64px` margins, premium whitespace |

### Touch Targets

- **Minimum height:** `44px` for all interactive elements (buttons, tabs, list items)
- **Minimum width:** `44px` for clickable regions
- **Minimum padding:** `8px` around touch targets to ensure adequate spacing
- **Recommended:** `48px–56px` for primary buttons and form inputs to exceed minimum
- **Spacing between targets:** Minimum `8px` gap to prevent accidental misclicks
- **Avatar/profile images:** Minimum `32px` diameter for tap-friendly size

### Collapsing Strategy

- **Hero sections:** Reduce vertical padding from `160px` (desktop) → `80px` (tablet) → `48px` (mobile)
- **Two-column layouts:** Stack vertically below `1024px` breakpoint; reverse order to prioritize content
- **Navigation:** Full horizontal menu desktop → hamburger menu mobile below `640px`
- **Card grids:** 4 columns → 2 columns → 1 column; maintain `16px` gap throughout
- **Form fields:** `300px` width → `100%` below tablet breakpoint
- **Spacing:** Reduce `48px` gaps to `32px` on tablet, `16px` on mobile
- **Font sizes:** Body text remains `18px` on tablet; reduce to `16px` on mobile only if space-constrained
- **Map/content split:** 60/40 desktop → full-width stacked below `1024px`

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Coral Red (`#F75940`) — buttons, key actions, brand highlight
- **Text / Headings:** Dark Charcoal (`#212529`) — highest contrast, primary readability
- **Secondary Text:** Medium Gray (`#6C757D`) — labels, supporting content, reduced emphasis
- **Background:** Off-White (`#FFFFFF`) — cards, containers, primary surface
- **Borders / Dividers:** Border Gray (`#DEE2E6`) — input borders, card edges, subtle separation
- **Success / Confirmed:** Success Green (`#17B978`) — positive states, checkmarks, completed actions
- **Error / Warning:** Danger Red (`#FF253A`) — critical alerts, form validation errors
- **Warning / Caution:** Warning Orange (`#EC9B3B`) — non-critical alerts, cautionary messages
- **Secondary Accent:** Deep Blue (`#3F52E3`) — focus states, links, alternative emphasis
- **Disabled / Muted:** Light Gray (`#E9ECEF`) — inactive elements, reduced functionality

### Iteration Guide

1. **Always use Source Sans 3** as the primary font stack; fallback to system sans-serif stack for web safety.
2. **Primary buttons require `#F75940` background, `#FFFFFF` text, `20px` border-radius, and `7px 16px` padding**; never compromise this pattern.
3. **Card styling defaults to `#FFFFFF` background, `#DEE2E6` border, `16px` border-radius, `16px` padding, and subtle shadow (`rgba(0, 0, 0, 0.1) 0px 2px 4px 0px`)**; extend with color overlays if needed.
4. **Text hierarchy: H1 48px/700, H2 36px/700, H3 24px/400, H4 16px/700, Body 18px/400, Small 14px/400**; maintain line-height at 1.2× font size.
5. **Input fields are `56px` tall, `8px` border-radius, `16px` horizontal padding, `#FFFFFF` background, `#DEE2E6` border**; focus state adds `2px solid #3F52E3` border.
6. **Spacing uses `8px` base unit with scale: 4, 8, 16, 20, 32, 48, 64, 80, 100, 160px**; prefer `32px` or `48px` for section gaps.
7. **Focus states for keyboard navigation require `2px solid #3F52E3` border on all interactive elements**; combine with box-shadow for visibility.
8. **Semantic colors for status: `#17B978` success, `#EC9B3B` warning, `#FF253A` error, `#17A2B8` info**; never repurpose these for other meanings.
9. **Elevation shadows follow a two-tier system: raised (standard cards), lifted (hovers, dropdowns), floating (modals)**; avoid inventing new shadow values.
10. **Mobile-first responsive design: stack single column by default, expand to 2 columns at `640px`, 3+ columns at `1024px`, with full layout at `1440px`**.
11. **Contrast minimum WCAG AA (4.5:1 body text, 3:1 UI); test all text/background pairs before shipping**.
12. **Button padding never drops below `8px`; touch targets minimum `44px` height, preferably `48px` or `56px`**.