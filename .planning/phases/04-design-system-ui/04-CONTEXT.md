# Phase 4: Design System & UI - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement Geist design tokens, shadcn/ui components, and Atomic Design hierarchy with light/dark mode toggle and responsive layout. This phase establishes the visual foundation that all subsequent user-facing features will build upon.

Scope includes:
- Geist design system with token-based styling
- Essential shadcn/ui components (Button, Input, Card, Dialog, Dropdown)
- Light/dark mode with system preference and database persistence
- Responsive design for mobile/tablet/desktop
- Internationalization support (English + Portuguese)
- Atomic Design component organization

</domain>

<decisions>
## Implementation Decisions

### Design System
- Follow Vercel's design system and fonts (Geist family)
- Use token-based styling (colors, spacing, typography) via Tailwind CSS
- Clean, minimal aesthetic matching Vercel/Linear style

### Component Library
- Install essential shadcn/ui components only: Button, Input, Card, Dialog, Dropdown
- Additional components will be installed on-demand as features need them
- Atomic Design hierarchy: atoms → molecules → organisms → templates → pages

### Theme & Dark Mode
- Theme toggle located in user avatar dropdown menu (cleaner UI)
- Persist theme preference to database (cross-device sync)
- Respect system preference by default
- Support light, dark, and system modes

### Internationalization
- Support two languages initially: English (en) and Brazilian Portuguese (pt-BR)
- Language preference stored in database
- Use cookie for SSR rendering (avoid hydration mismatches)
- Language switcher placement: TBD (likely user dropdown near theme toggle)
- All date/number formatting must be locale-aware

### Responsive Design
- Breakpoints: mobile (320px) → tablet (768px) → desktop (1920px)
- Mobile-first approach
- Layout adapts gracefully across all breakpoints

### Claude's Discretion
- Exact color token values (follow Geist defaults)
- Component folder structure details
- Transition/animation behavior for theme switching
- Error state handling for i18n loading
- Specific spacing values within design tokens

</decisions>

<specifics>
## Specific Ideas

- "Follow Vercel design system and fonts" — Use Geist Sans and Geist Mono, match Vercel's clean aesthetic
- Components should feel like Linear's issue cards — clean, not cluttered
- Language switcher should be easily accessible but not in the way

</specifics>

<deferred>
## Deferred Ideas

- Additional languages (Spanish, etc.) — add in future phase
- Advanced animations/micro-interactions — can be added later
- Custom component library beyond shadcn/ui — evaluate need later
- Design tokens export for Figma — future tooling enhancement

</deferred>

---

*Phase: 04-design-system-ui*
*Context gathered: 2026-02-19*
