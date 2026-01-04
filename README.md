# 🎯 Regal Cleaners - Stop the Clock Challenge

A customer engagement game for your dry cleaning counter. Customers try to stop a timer exactly on 3.00 seconds to win 3 free pieces cleaned and pressed!

## Features

- **3 Attempts System**: 
  - 1st attempt: Free
  - 2nd attempt: Earned by answering a pickup/delivery survey
  - 3rd attempt: Earned by scanning the Google review QR code or leaving a testimonial

- **Data Logging**: All attempts, survey responses, and testimonials are logged to Supabase

- **Tablet Optimized**: Full-screen, touch-friendly design for counter displays

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/stopwatch-challenge.git
cd stopwatch-challenge
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase-schema.sql`
3. Go to Settings > API and copy your URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Update Google Review Link

In `src/App.jsx`, update the `GOOGLE_REVIEW_URL` constant with your business's Google review link:

```javascript
const GOOGLE_REVIEW_URL = 'https://g.page/r/YOUR_PLACE_ID/review'
```

To find your review link:
1. Search for your business on Google
2. Click "Write a review"
3. Copy that URL

### 5. Run Locally

```bash
npm run dev
```

## Deploying to Netlify

### Option 1: Connect to GitHub

1. Push this repo to GitHub
2. Log into Netlify and click "New site from Git"
3. Select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables in Netlify's settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option 2: Manual Deploy

```bash
npm run build
# Drag the 'dist' folder to Netlify
```

## Viewing Analytics

In Supabase, you can run queries or use the built-in views:

```sql
-- See daily stats
SELECT * FROM daily_stats;

-- See survey interest
SELECT * FROM survey_summary;

-- See all testimonials
SELECT * FROM stopwatch_testimonials ORDER BY created_at DESC;

-- See interested leads
SELECT s.*, ss.interested_in_pickup
FROM stopwatch_sessions s
JOIN stopwatch_surveys ss ON s.id = ss.session_id
WHERE ss.interested_in_pickup = true;
```

## Customization

### Changing the Target Time
In `App.jsx`, modify the winning condition:
```javascript
const isWin = finalTime >= 2995 && finalTime <= 3005
```

### Changing the Prize
Update the text in the JSX where it says "3 FREE PIECES"

### Styling
All styles are in `App.css` - the design uses CSS variables for easy theming.

## Tech Stack

- React 18
- Vite
- Supabase (PostgreSQL)
- react-confetti (for win animations)
- qrcode.react (for Google review QR code)

## License

MIT - Use freely for your business!
