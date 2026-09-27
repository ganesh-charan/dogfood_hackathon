# Design System & UI/UX Specification

## 1. Design Philosophy: "Futuristic Glassmorphic Precision"

The UI/UX of the **Dog Food Hackathon Platform** is crafted to provide a visually captivating first impression while maintaining strict functional clarity and low cognitive load.

### Core Visual Tenets:
- **Atmospheric Depth**: Multi-layered backgrounds combining dynamic 3D WebGL particle fields with subtle radial glow accents.
- **Glassmorphism**: Translucent card panels with frosted glass blurs (`backdrop-filter: blur(12px)`) that float above animated backgrounds without obscuring legibility.
- **Micro-Animations**: Framer Motion orchestrating entry transitions, hover lifts, and state feedback.
- **Color Harmony**: Tailored indigo and pink gradient spectrum against deep carbon-slate surfaces.

---

## 2. Design Tokens & Color Palette

All tokens are defined natively in `src/app/globals.css` as CSS custom properties:

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--bg-primary` | `#0a0a0f` | Global base background |
| `--bg-secondary` | `rgba(25, 25, 35, 0.6)` | Secondary card & container background |
| `--bg-card` | `rgba(30, 30, 45, 0.4)` | Translucent glassmorphic card panels |
| `--text-primary` | `#f4f4f5` | High-contrast primary headings and content |
| `--text-secondary` | `#a1a1aa` | Muted labels, secondary descriptions |
| `--text-muted` | `#71717a` | Captions, placeholders, inactive states |
| `--accent-primary` | `#6366f1` | Electric Indigo (Primary CTA, highlights) |
| `--accent-secondary` | `#ec4899` | Neon Pink (Gradient end, alerts, flair) |
| `--accent-tertiary` | `#14b8a6` | Cyber Teal (Success indicators, verified badges) |
| `--accent-gradient` | `linear-gradient(135deg, #6366f1, #ec4899)` | Hero text, primary action buttons |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Structural panel separators |
| `--border-glow` | `rgba(99, 102, 241, 0.3)` | Hover borders and active input rings |
| `--shadow-glow` | `0 0 20px rgba(99, 102, 241, 0.2)` | Soft ambient button and element glow |

---

## 3. Typography Hierarchy

```css
--font-heading: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

- **H1 (Display Hero)**: 4.5rem (72px), Line-height 1.1, Letter-spacing -0.03em, Weight 800 (Outfit).
- **H2 (Section Titles)**: 2.5rem (40px), Line-height 1.2, Letter-spacing -0.02em, Weight 700 (Outfit).
- **H3 (Card Headlines)**: 1.5rem (24px), Line-height 1.3, Weight 600 (Outfit).
- **Body Regular**: 1.0rem (16px), Line-height 1.6, Weight 400 (Inter).
- **Meta / Badges**: 0.75rem (12px), Line-height 1.0, Weight 700 (Inter, Uppercase).

---

## 4. 3D WebGL Canvas Architecture (`ThreeScene.tsx`)

The landing page features an embedded, non-blocking 3D scene powered by `@react-three/fiber` and `@react-three/drei`:

- **Dynamic Distortion Sphere**:
  - Procedural vertex noise distortion via `MeshDistortMaterial`.
  - Properties: `distort: 0.4`, `speed: 2.0`, `metalness: 0.8`, `roughness: 0.2`.
  - Double lighting setup with an indigo key light and pink rim light.
- **Procedural Deep Space Starfield**:
  - 5,000 randomized star coordinates generated with fading alpha channels.
  - Constant rotational velocity driven by `requestAnimationFrame` delta clock.
- **Performance Optimization**:
  - `pointerEvents: 'none'` ensures 3D canvas never intercepts mouse clicks intended for UI buttons.
  - Dynamically loaded with `ssr: false` to ensure zero hydration lag on low-power devices.

---

## 5. Component Patterns & UI Library

### 5.1 Glassmorphic Cards (`.glass-panel`)
```css
.glass-panel {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
```

### 5.2 Responsive Buttons (`.btn`, `.btn-primary`, `.btn-secondary`)
- Pill-shaped radius (`border-radius: 9999px`).
- Subtle 2px elevation transform on `:hover` combined with localized box-shadow bloom.

### 5.3 Dark Mode Form Controls (`.input-field`)
- Translucent input background with smooth focus ring transition:
  `box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2)`.
