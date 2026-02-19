# Lynk - Smart Bookmark Manager

A private, real-time bookmark manager built with Next.js and Supabase.

LYNK - https://lynk-pearl.vercel.app/


## Features
- Google OAuth authentication (no email/password)
- Private bookmarks per user (Row Level Security)
- Real-time sync across tabs without page refresh
- List and Card view toggle
- Deployed on Vercel

## Tech Stack
- Next.js 14 (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS

## Problems Faced & Solutions

### 1. Realtime not syncing across tabs
The WebSocket connection kept showing TIMED_OUT and CHANNEL_ERROR on localhost. 
Solution: Used `supabase.realtime.setAuth(session.access_token)` to explicitly 
authenticate the WebSocket connection, and added a re-fetch on every SUBSCRIBED 
event to catch any missed updates during reconnection.

### 2. Cross-user data leaking via Realtime
Realtime events were broadcasting all users' bookmarks to all tabs.
Solution: Added client-side `user_id` guards on every INSERT/UPDATE/DELETE 
event handler, plus Supabase Row Level Security policies on the database.

### 3. Google OAuth redirecting to localhost after deployment
After deploying to Vercel, Google login redirected back to localhost.
Solution: Updated Supabase Auth URL Configuration with the Vercel production URL.

