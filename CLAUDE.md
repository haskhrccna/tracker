# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build locally

No test framework is configured. No linter is configured.

## Architecture

Quran memorization progress tracker with role-based dashboards (teacher, student, admin). Built with React 18 + Vite, using Supabase as the primary backend with localStorage fallback for demo/offline mode.

### Key Files

- `src/App.jsx` — Root component, handles auth state and role-based routing
- `src/utils/db.js` — Data access layer abstracting Supabase and localStorage
- `src/utils/constants.js` — App constants including the 114 surahs list
- `src/utils/styles.js` — Theme-aware styling system (dark/light, RTL/LTR)
- `src/lib/supabase.js` — Supabase client initialization
- `supabase/schema.sql` — Complete database schema with RLS policies

### Data Flow

All data operations go through `src/utils/db.js`, which provides a unified API. When Supabase credentials are configured, it uses the Supabase client; otherwise it falls back to localStorage. Components never call Supabase directly.

### Internationalization

i18next with three locales: Arabic (default, RTL), English, French. Translation files are in `src/i18n/locales/`. The app uses `react-i18next` hooks (`useTranslation`) throughout components.

### Styling

No CSS framework. Theme-aware styles are generated via `getStyles()` functions in components using the `ThemeContext`. Supports dark/light mode and RTL direction.

### Supabase Schema

Key tables: `profiles` (users with role field), `records` (recitation entries), `reviews` (teacher assessments), `classes` (student groups). Row Level Security policies enforce role-based access. See `supabase/schema.sql` for the full schema and migration files for incremental changes.

## Deployment

Deployed on Netlify. See `netlify.toml` for build config and SPA redirect rules. `NETLIFY_DEPLOYMENT.md` has deployment instructions.
