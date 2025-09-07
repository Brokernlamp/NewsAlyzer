# NewsAlyzer - Local Development

- Install dependencies: `npm install`
- Start the app: `npm run dev`
- App URL: `http://127.0.0.1:5000`

## Environment Variables
Create a `.env` file in the project root:

```
PORT=5000
HOST=127.0.0.1
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- Leave `TELEGRAM_*` empty to disable Telegram; uploads will be stored locally in `uploads/`.
- Supabase keys are optional unless enabling related features.

## Windows Notes
Scripts use `cross-env` to work in PowerShell and Unix shells.
