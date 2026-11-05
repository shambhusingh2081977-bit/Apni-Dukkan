# Built To Stock — PWA Web App Manifest & Installation Setup

Configure Progressive Web App (PWA) installability for the "Built To Stock" retail POS by creating a compliant `public/manifest.json` with multi-resolution icon definitions, standalone display mode, brand theming, and linking it with accompanying mobile meta tags in `index.html`.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were dismissed, so we are proceeding with the recommended standards for retail POS applications:
> - **Display Mode**: `standalone` (hides the browser URL bar, giving shopkeepers a full-screen native mobile application feel).
> - **Theme Color**: `#059669` (Emerald 600) matching the app's brand accent and header, with background color `#0f172a` (Slate 900) for smooth splash screen transitions.
> - **App Short Name**: `BuiltToStock` (12 characters, complying with the mobile home screen truncation rule).

- **Confirmed Decision**: Create `public/manifest.json` with complete PWA schema fields (`id`, `name`, `short_name`, `start_url`, `scope`, `display`, `theme_color`, `background_color`, `icons`, `categories`).
- **Icon Strategy**: Provide standard icons in `public/` (including 192x192, 512x512, maskable with 15% safe padding, and vector SVG) featuring the Built To Stock store icon with Indian Rupee symbol.
- **HTML Integration**: Update `index.html` to link `/manifest.json`, configure mobile viewport, Apple touch icon, and mobile web app capability tags.

---

### 1. Overview & Core Concept

- **What It Does**: Enables shopkeepers to install "Built To Stock" directly onto Android, iOS, and desktop home screens with a single tap, eliminating browser frame clutter and launching like a native app.
- **Target Audience**: Retail kirana and store owners running counter operations on mobile phones or tablets.
- **Key Value**: 1-tap launch from the home screen, instant load time, offline data caching, and native-like standalone presence without requiring app store distribution.

---

### 2. User Experience & Visual Design

- **Home Screen Presentation**:
  - **App Icon**: Modern emerald-green badge with crisp shopfront and rupee silhouette.
  - **Label**: `BuiltToStock` formatted to fit comfortably below the icon without ellipsis truncation.
  - **Splash Screen**: Seamless slate-900 splash with emerald brand accent while the app initializes.
- **Browser & Shell Experience**:
  - The browser navigation bar and footer are completely hidden in `standalone` mode, maximizing screen real estate for billing and inventory management.
  - Android status bar colored in emerald `#059669` to seamlessly match the top navigation bar.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Manifest Display Mode (`standalone` vs `fullscreen`)**
  - *Chosen Approach*: `standalone`.
  - *Why*: Provides native app aesthetics while preserving system status indicators (battery, network, clock) which shopkeepers need during business hours.
  - *Alternatives Considered*: `fullscreen` (rejected as it hides the Android clock and battery status).

- **Decision 2: Maskable & Any Icons Separation**
  - *Chosen Approach*: Define separate icons for `purpose: "any"` and `purpose: "maskable"`.
  - *Why*: Android adaptive launcher crops maskable icons into circles or squircles. Providing a maskable version with a 15% safe-zone margin prevents edge clipping.

- **Decision 3: HTML Head Meta Tags for Cross-Platform Support**
  - *Chosen Approach*: In addition to `<link rel="manifest" href="/manifest.json" />`, add `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, and `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.
  - *Why*: Ensures compatibility across Chromium, Samsung Internet, and iOS Safari.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────┐
│                   BROWSER / MOBILE OS                    │
└──────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│      index.html       │         │ public/manifest.json  │
│  - rel="manifest"     │ ──────> │  - id: "/"            │
│  - theme-color        │         │  - display: standalone│
│  - apple-touch-icon   │         │  - icons: 192 / 512   │
│  - mobile-web-app     │         │  - theme: #059669     │
└───────────────────────┘         └───────────────────────┘
                                              │
                                              ▼
                                  ┌───────────────────────┐
                                  │     Icon Assets       │
                                  │  - icon.svg           │
                                  │  - pwa-192x192.png    │
                                  │  - pwa-512x512.png    │
                                  │  - apple-touch-icon   │
                                  └───────────────────────┘
```

#### Files to Create / Modify:
1. `public/manifest.json`: Web App Manifest containing JSON metadata, display properties, and icon links.
2. `public/icon.svg` & companion icon assets: High-contrast brand icons for home screen and launcher display.
3. `index.html`: Update `<head>` section with `<link rel="manifest" href="/manifest.json" />` and mobile platform meta tags.
