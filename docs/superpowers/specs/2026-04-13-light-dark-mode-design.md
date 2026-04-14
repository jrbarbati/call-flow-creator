# Light/Dark Mode Toggle

## Overview
Add a theme toggle to the app header that switches between light and dark modes. Preference persists via localStorage.

## Architecture

### ThemeService (root-level)
- Signal-based: `theme: WritableSignal<'light' | 'dark'>`
- On init: read `localStorage.getItem('cfc-theme')`, default to `'dark'`
- On change: write to localStorage, set `document.documentElement.dataset['theme']`
- `toggle()` method swaps between light/dark
- Provided in root (singleton)

### CSS Variables
Restructure `styles.scss` from single `:root` block to two theme-scoped blocks:

```
:root[data-theme="dark"] { ... }
:root[data-theme="light"] { ... }
```

Dark theme keeps current values. Light theme:

| Token | Dark | Light |
|-------|------|-------|
| `--canvas-bg` | `#16181D` | `#F0F1F5` |
| `--canvas-dot` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` |
| `--node-bg` | `#1E2028` | `#FFFFFF` |
| `--node-bg-hover` | `#24262F` | `#F5F5F7` |
| `--node-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.12)` |
| `--node-border-hover` | `rgba(255,255,255,0.16)` | `rgba(0,0,0,0.2)` |
| `--node-shadow` | `0 2px 8px rgba(0,0,0,0.4)` | `0 2px 8px rgba(0,0,0,0.1)` |
| `--node-label-color` | `#E8EAF0` | `#1A1C22` |
| `--edge-color` | `rgba(255,255,255,0.2)` | `rgba(0,0,0,0.25)` |
| `--edge-color-hover` | `rgba(255,255,255,0.4)` | `rgba(0,0,0,0.45)` |
| `--palette-bg` | `#0F1117` | `#E8E9ED` |
| `--palette-border` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` |
| `--palette-item-bg` | `#1E2028` | `#FFFFFF` |
| `--palette-item-bg-hover` | `#24262F` | `#F5F5F7` |
| `--palette-item-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.1)` |
| `--palette-label` | `rgba(255,255,255,0.4)` | `rgba(0,0,0,0.5)` |
| `--header-bg` | `#0F1117` | `#E8E9ED` |
| `--header-border` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` |
| `--header-text` | `rgba(255,255,255,0.85)` | `#1A1C22` |
| `--zoom-bg` | `#1E2028` | `#FFFFFF` |
| `--zoom-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.1)` |
| `--zoom-text` | `rgba(255,255,255,0.6)` | `rgba(0,0,0,0.5)` |
| `--zoom-text-hover` | `rgba(255,255,255,0.9)` | `rgba(0,0,0,0.8)` |
| `--action-edit-bg` | `rgba(30,32,40,0.9)` | `rgba(255,255,255,0.9)` |
| `--action-delete-bg` | `rgba(30,32,40,0.9)` | `rgba(255,255,255,0.9)` |
| `--action-icon` | `rgba(255,255,255,0.5)` | `rgba(0,0,0,0.5)` |
| `--edit-input-bg` | `#16181D` | `#FFFFFF` |
| `--edit-input-text` | `#E8EAF0` | `#1A1C22` |
| `--port-border` | `#16181D` | `#F0F1F5` |
| `--selection-fill` | `rgba(245,158,11,0.05)` | `rgba(245,158,11,0.08)` |
| `--live-edge-color` | `rgba(245,158,11,0.6)` | `rgba(245,158,11,0.7)` |

Accent color `#F59E0B` unchanged — works on both themes.

### Toggle Button
- Location: app header, right-aligned
- Icon: `☀` (sun) when dark mode active, `☾` (moon) when light mode active
- Click calls `themeService.toggle()`
- Styled to match header aesthetic

### Flash Prevention
ThemeService constructor runs synchronously on app init. Sets `data-theme` on `<html>` before first paint. No visible flash.

## Files

| File | Action |
|------|--------|
| `src/app/theme.service.ts` | Create |
| `src/styles.scss` | Modify — split vars into theme blocks |
| `src/app/app.ts` | Modify — inject ThemeService, add toggle |
| `src/app/app.html` | Modify — add toggle button to header |
| `src/app/app.scss` | Modify — add toggle button styles |
