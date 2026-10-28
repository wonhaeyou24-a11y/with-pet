---
name: Warm Clay Pet Haven
colors:
  surface: '#fff8f7'
  surface-dim: '#e9d5d5'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0f0'
  surface-container: '#fee9e9'
  surface-container-high: '#f8e4e3'
  surface-container-highest: '#f2dedd'
  on-surface: '#231919'
  on-surface-variant: '#56423c'
  inverse-surface: '#392d2d'
  inverse-on-surface: '#ffedec'
  outline: '#89726b'
  outline-variant: '#ddc0b8'
  surface-tint: '#9f4122'
  primary: '#9f4122'
  on-primary: '#ffffff'
  primary-container: '#ff8a65'
  on-primary-container: '#752305'
  inverse-primary: '#ffb59e'
  secondary: '#0f6c4d'
  on-secondary: '#ffffff'
  secondary-container: '#9ef1c9'
  on-secondary-container: '#177051'
  tertiary: '#765b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#caa646'
  on-tertiary-container: '#4f3c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0b00'
  on-primary-fixed-variant: '#7f2a0d'
  secondary-fixed: '#a1f3cc'
  secondary-fixed-dim: '#85d7b1'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005138'
  tertiary-fixed: '#ffdf92'
  tertiary-fixed-dim: '#e8c25f'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fff8f7'
  on-background: '#231919'
  surface-variant: '#f2dedd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style
The design system crafts an affectionate, soothing sanctuary for digital companions. Targeted at cozy game enthusiasts, casual mobile collectors, and audiences seeking de-stressing micro-moments throughout their day, the visual language prioritizes tenderness, tactile reassurance, and playful warmth.

The aesthetic merges soft claymorphism with organic storybook warmth:
- Surfaces appear gently sculpted, rounded, and pillow-soft rather than clinically digital.
- Interactive controls evoke pillowy buttons and physical wooden-ceramic game tokens.
- Korean text layouts favor spacious, readable pacing with friendly, approachable geometry.
- Every state transition and interactive cue rewards the user with soft, bouncy responsiveness.

## Colors
The palette balances creamy domestic comfort with warm, appetizing accents:
- **Base Canvas (`#FFF8E7` to `#FFF4D6`)**: A rich custard and milk-tea warmth that eliminates screen glare, offering an analog paper/canvas comfort.
- **Primary Accent (`#FF8A65`)**: Sweet baked coral used strictly for focal calls-to-action, active indicators, and high-value pet interactions (feed, train, collect).
- **Secondary Accent (`#76C7A2`)**: Calming soft herbal mint used for wellness gauges, stamina recovery, inventory tags, and nature-themed elements.
- **Tertiary Accent (`#FAD36E`)**: Warm honeysuckle yellow for level-ups, currency (coins/stars), and affection badges.
- **Card Fill (`#FFFFFF`) & Border (`#F0DFB8`)**: High-legibility cloud-white tiles framed by hand-baked wheat borders to retain structural definition against the custard backdrop.
- **Typography (`#3B2F2F`)**: Roasted espresso brown that provides high contrast without the harsh artificial coldness of pure black.

## Typography
`Plus Jakarta Sans` is paired with modern Korean system typography (Apple SD Gothic Neo, Pretendard, or Noto Sans KR fallback). Its rounded terminals and open apertures align directly with the gentle monster-care theme.

Guidelines:
- Korean glyphs are rendered with slightly relaxed line heights (`1.5` to `1.6`) to prevent dense Hangul blocks from feeling visually claustrophobic.
- Headings leverage heavier weights (`700` and `800`) to balance soft UI clay containers with definite visual anchoring.
- Status labels and pet metrics use uppercase/prominent weights (`Label` scales) in warm espresso `#3B2F2F` or tint tones.

## Layout & Spacing
A portrait-first mobile layout centered on comfortable thumb navigation and bottom-sheet interactive panels.

Grid & Flow:
- Mobile screens rely on a fluid 4-column structure with `1.25rem` outer canvas padding to accommodate curved display corners and safe areas.
- Tablet and foldables pin main interactive views into a centered canvas (max 480px width) framed by soft pasture or pet room illustrations.
- Vertical distribution uses a roomy 8pt rhythm, grouping pet statistics, action hubs, and inventory drawers into modular pill-shaped pods.

## Elevation & Depth
Depth in this system mimics soft clay modeling, pressed foam, and thick rounded cards instead of dark digital drop shadows:
- **Base Floor**: Flat `#FFF4D6` canvas with subtle hand-painted warm speckles or soft ground gradients.
- **Resting Elements (Tier 1)**: White surfaces (`#FFFFFF`) framed with a 1.5px solid border in `#F0DFB8` and a warm diffused drop shadow: `0 4px 12px rgba(186, 142, 75, 0.12)`.
- **Raised Clay Elements (Tier 2 - Buttons & Badges)**: A dual-layered effect consisting of an inner top-highlight `inset 0 2px 0 rgba(255, 255, 255, 0.45)`, a thick bottom edge shadow `inset 0 -3px 0 rgba(0, 0, 0, 0.12)`, and a soft drop shadow `0 6px 16px rgba(255, 138, 101, 0.28)`.
- **Floating Modals & Sheets (Tier 3)**: Overlay surfaces use an ambient amber tint shadow `0 12px 32px rgba(89, 62, 34, 0.18)` over a 30% warm-cream dimmed backdrop (`rgba(59, 47, 47, 0.45)` with `4px` blur).

## Shapes
A pill-shaped, super-elliptical (`roundedness: 3`) profile rules every element. Severe angles and sharp corners are strictly omitted.
- Standard buttons and status tags feature complete capsules (`9999px` / pill radius).
- Main content cards, pet status containers, and dialogues use hyper-soft rounded corners (`2rem` / `32px` on mobile, scaling to `2.5rem` on larger elements).
- Icon containers and avatar frames adopt "squircle" forms with a squishy tactile presence.

## Components

### Buttons
- **Primary Action (Feed, Play, Confirm)**: Baked Coral `#FF8A65` fill with white text (`#FFFFFF`, label-lg), a 3D clay bottom rim (`box-shadow: inset 0 -4px 0 #E56E49`), and subtle top highlight. On tap/active, the button compresses downward by 3px with the bottom rim flattening to 1px.
- **Secondary Action (Sub-menus, Back)**: Mint `#76C7A2` or Soft Yellow `#FAD36E` fill with espresso `#3B2F2F` text and matching darker baseline bevels.
- **Ghost/Tertiary Action**: Transparent fill, 2px border in `#F0DFB8`, text in `#3B2F2F`.

### Cards & Panels
- **Pet Stage Card**: `#FFFFFF` background, 2px border in `#F0DFB8`, `2rem` rounded corners, padding `space-lg`. Contains pet avatar showcase, affection heart badges, and quick stat meters.
- **Inventory Pod**: Small rounded square cards (`1.25rem` radius), biscuit beige background (`#FFF8EC`), displaying monster treat icon and count pills.

### Stat & Gauge Bars (Affection, Energy, Fullness)
- Thick pill containers (`16px` height) with `#F5E8C9` track.
- Filled with vivid gradient pulses: Coral for Fullness, Mint for Energy, Soft Honey for Affection.
- Caps contain a small glossy pill highlight along the upper half for a gummy candy look.

### Chips & Badges
- Capsule pills with `0.375rem` vertical and `0.75rem` horizontal padding.
- Monster Attribute Tags (e.g., '아기 몬스터', '행복함', '잠자는 중') use tinted pastel backgrounds (`#E8F7F0` for mint, `#FFF2DE` for yellow) with bold espresso typography.

### Checkboxes & Radio Selectors
- Custom cookie/paw-print toggles. Unchecked: `#FFFFFF` circle with 2px `#F0DFB8` border. Checked: Coral `#FF8A65` fill featuring a soft cream checkmark or tiny paw-stamp icon in `#FFFFFF`.

### Input Fields (Pet Naming, Chat)
- White pill container with a recessed inner shadow (`inset 0 2px 4px rgba(59, 47, 47, 0.06)`), 1.5px `#F0DFB8` border. Placeholder text in muted warm cocoa (`#A39184`). Focused state highlights border in `#FF8A65`.

### Pet Interaction Floating Action Bar
- A curved bottom dock hovering 16px above the home indicator. White translucent-clay backing (`rgba(255, 255, 255, 0.95)` with backdrop blur) housing oversized circular action bubbles for "간식주기" (Snack), "놀아주기" (Play), and "씻기기" (Wash).