# NutriSnap Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SUPABASE_URL=https://adxtkbhtezlzuydrzmcx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHRrYmh0ZXpsenV5ZHJ6bWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzc0NjIsImV4cCI6MjA3MDkxMzQ2Mn0.IEQZLSHdJ8nyz8-Hc8wxgHhPHu7slcL3vkeFSBjKsx0
GEMINI_API_KEY=AIzaSyD1F8_nwp5dz9KG3RtHe12iHYNjvwSKizs
```

## Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `database-schema.sql` to create the necessary tables and policies

## Install Dependencies

```bash
npm install
```

## Development

```bash
npm run dev
```

## Features Implemented

- **Supabase Integration**: Full database integration with authentication and data persistence
- **Gemini AI**: Image analysis for nutritional information
- **User Management**: User profiles and meal tracking
- **Security**: Row Level Security (RLS) policies for data protection

## Database Tables

### meals
- Stores user meal entries with nutritional information
- Includes image URLs and timestamps
- Protected by RLS policies

### profiles
- Stores user profile information
- Includes health metrics and goals
- Protected by RLS policies

## Services

- `supabaseService.ts`: Main database operations
- `geminiService.ts`: AI-powered image analysis
- Authentication and user management
- Meal and profile CRUD operations
