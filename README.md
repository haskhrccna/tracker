# Quran Tracker

A Quran memorization progress tracker built with React and Vite. This app supports both localStorage persistence for demo mode and Supabase storage for a production-ready backend.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Configure Supabase (optional):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If Supabase is not configured, the app falls back to localStorage persistence.

4. (Optional) Configure Twilio WhatsApp if you want message notifications:

- `VITE_TWILIO_ACCOUNT_SID`
- `VITE_TWILIO_AUTH_TOKEN`
- `VITE_TWILIO_WHATSAPP_NUMBER`

5. Start the dev server:

```bash
npm run dev
```

## Notes

- The app now supports backend auth and storage when Supabase credentials are provided.
- Registration includes an optional email field for backend signup.
- Teacher dashboard and record management are wired for backend storage while preserving local fallback behavior.
