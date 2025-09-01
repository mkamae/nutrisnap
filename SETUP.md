# NutriSnap Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SUPABASE_URL=YOUR_SUPABASE_URL_HERE
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
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
