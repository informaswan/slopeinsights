# PowderPass Frontend Redesign

## Overview

Redesign the PowderPass frontend to add user authentication, a personalized home page with saved mountain preferences, a new color scheme, and proper header titles. Replaces the current dark-only "Pre-Dawn Alpine" theme with a dual-theme system (Alpine Morning light + Deep Ocean dark).

## Authentication

### Provider
Google + Apple social login only. No email/password.

### Backend
- Add `users` table (id, name, email, avatar_url, provider, provider_id, created_at, updated_at)
- Add `user_resorts` table (user_id, resort_id, added_at) — many-to-many join
- JWT token-based auth: backend validates Google/Apple tokens, issues its own JWT
- New endpoints:
  - `POST /api/auth/google` — accepts Google ID token, returns JWT + user
  - `POST /api/auth/apple` — accepts Apple identity token, returns JWT + user
  - `GET /api/auth/me` — returns current user from JWT
  - `GET /api/users/me/resorts` — list saved resort IDs
  - `PUT /api/users/me/resorts` — update saved resort list (full replacement)
- Protected endpoints: all user-specific routes require valid JWT in `Authorization: Bearer` header
- Alembic migration for new tables

### Frontend
- `expo-auth-session` for Google OAuth
- `expo-apple-authentication` for Apple Sign In
- Store JWT in `expo-secure-store` (native) / AsyncStorage (web fallback)
- Auth context provider wrapping the app — exposes `user`, `signIn`, `signOut`, `isAuthenticated`

## Screens

### 1. Login Page (`app/login.tsx`)
- Full-screen gradient background (Alpine Morning blue gradient → light)
- Centered mountain logo (geometric SVG) + "PowderPass" wordmark + tagline
- "Continue with Google" button (white, Google colors)
- "Continue with Apple" button (black)
- Terms/privacy text at bottom
- No header bar (headerShown: false)

### 2. Onboarding — Pick Your Mountains (`app/onboarding.tsx`)
- Shown once after first sign-in (when user has 0 saved resorts)
- Header: "Pick Your Mountains" with subtitle "Select the resorts you want to track"
- Pass type tabs at top: Epic | Ikon (styled as pills)
- Within each pass type, resorts grouped by region (Colorado, Utah, California, etc.)
- Region headers: small uppercase label
- Each resort row: name, location, checkbox toggle
- Selected resorts get a blue border + filled checkbox
- Bottom sticky bar: "{N} resorts selected" + "Let's Go" button
- Minimum 1 resort required to proceed
- On submit: `PUT /api/users/me/resorts` with selected IDs

### 3. Home Page (`app/index.tsx`)
- Header: mountain logo + "PowderPass" on left, search icon (links to Explore) + avatar initials on right
- Contextual greeting: "Hey {name}" with optional powder alert ("2 of your mountains got fresh powder overnight")
- Shows only the user's saved resorts as cards
- Resort cards retain existing data display: name, location, pass badge, base depth, 24h new snow, lifts open, crowd level
- Pass type filter tabs (All/Epic/Ikon) below header
- Filter button retained for sort + region filtering
- Pull-to-refresh retained

### 4. Explore Resorts (`app/explore.tsx`)
- Header: "Explore Resorts"
- Search bar at top (filters across all regions)
- Pass type filter pills: Epic | Ikon | All
- Resorts grouped by region within the selected pass type (same layout as onboarding): region headers as uppercase labels, resort rows beneath each
- Each resort row shows: name, location, pass type color indicator bar
- "Add" button for resorts not in user's list
- "Remove" button (red) for resorts already saved
- Add/remove updates the full resort list via `PUT /api/users/me/resorts` (frontend maintains local state, sends complete ID array on each change)

### 5. Profile / Settings (`app/profile.tsx`)
- Accessed by tapping avatar initials in home header
- Blue gradient header with large avatar + name + email
- Settings list:
  - "My Resorts" → navigates to Explore page (shows count)
  - "Dark Mode" → toggle switch
  - "Notifications" → future feature placeholder
  - "Sign Out" → clears JWT, returns to login
- Dark mode preference stored locally (AsyncStorage) — not synced to backend

### 6. Resort Detail (`app/resort/[id].tsx`)
- No structural changes to this page
- Fix header title: dynamically set to resort name instead of showing route path
- Apply new color theme

## Color Theme

### Light Mode — Alpine Morning
```
header gradient:     #1e3a5f → #2d5a87
background:          #f0f4f8
surface (cards):     #ffffff
surfaceAlt:          #f8fafc
text primary:        #1e3a5f
text secondary:      #64748b
text muted:          #94a3b8
border:              #e2e8f0
epic:                #3B82F6
ikon:                #F97316
crowd low:           #059669 (text), rgba(52,211,153,0.1) (bg)
crowd medium:        #d97706 (text), rgba(251,191,36,0.1) (bg)
crowd high:          #ef4444 (text), rgba(239,68,68,0.1) (bg)
snow new accent:     #3B82F6
```

### Dark Mode — Deep Ocean
```
header gradient:     #0f2942 → #163d5e
background:          #0c1f33
surface (cards):     #132d47
surfaceAlt:          #1a3550
text primary:        #e0eaf5
text secondary:      #6a94b8
text muted:          #4a7a9e
border:              rgba(106,148,184,0.2)
card border:         rgba(pass_color, 0.12) — subtle colored glow
epic:                #7cb8f7 (text), rgba(59,130,246,0.2) (bg)
ikon:                #fb923c (text), rgba(249,115,22,0.2) (bg)
crowd low:           #6ee7b7 (text), rgba(52,211,153,0.12) (bg)
crowd medium:        #fcd34d (text), rgba(251,191,36,0.12) (bg)
crowd high:          #fca5a5 (text), rgba(239,68,68,0.12) (bg)
snow new accent:     #7cb8f7
```

### Implementation
- Refactor `constants/theme.ts` to export `LightColors` and `DarkColors` objects with the same keys
- Create a `ThemeContext` (React context) that provides the active color set + toggle function
- Dark mode preference persisted in AsyncStorage
- All components consume colors from `useTheme()` hook instead of importing `Colors` directly

## Mountain Logo

Simple geometric SVG icon: two nested triangles (mountain silhouette) with a subtle snow line. Rendered inline — no image asset needed. Used in:
- Login page (large, 64px)
- Home header (small, 28px)
- App icon (separate asset if needed later)

## Header Title Fix

The Expo Router `Stack.Screen` options need explicit titles:
- `index` → "PowderPass" (though the custom header replaces this)
- `resort/[id]` → dynamically set to `resort.name` using `navigation.setOptions({ title: resort.name })`
- `login` → headerShown: false
- `onboarding` → "Pick Your Mountains"
- `explore` → "Explore Resorts"
- `profile` → "Profile"

## Navigation Structure

```
Stack (root)
├── login          (unauthenticated)
├── onboarding     (authenticated, first time)
├── index          (authenticated, home)
├── explore        (authenticated)
├── profile        (authenticated)
└── resort/[id]    (authenticated)
```

`_layout.tsx` checks auth state:
- No JWT → show login
- JWT valid, 0 saved resorts → show onboarding
- JWT valid, has resorts → show home

## Notifications (Placeholder)

The profile page includes a "Notifications" row. For this iteration, tapping it shows a simple "Coming soon" alert. No backend work needed. This is a future feature for powder alerts, crowd warnings, etc.

## Existing Features Preserved

- Paywall flow (already in place, remains as-is — runs before auth check)
- Resort detail page (all sections: webcams, snow stats, crowd chart, weather, lifts, parking)
- Filter sheet (sort + region filters on home page)
- Best resorts banner (shown on home page if applicable to saved resorts)
- Pull-to-refresh
- Error/retry states
- API rate limiting (unchanged)
- Backend scrapers (unchanged)
