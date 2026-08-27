# Railway Deployment

## Deployment on Railway

1. Fork this repo to GitHub
2. Create a new project on Railway from your GitHub repo
3. Add environment variables in Railway:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

4. Railway will auto-detect Vite and deploy

## Local Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```