<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NutriSnap

A React-based nutrition tracking application that uses AI-powered image analysis to automatically detect and log nutritional information from food photos.

## Features

- 📸 **AI-Powered Image Analysis**: Uses Google Gemini AI to analyze food photos and extract nutritional data
- 🗄️ **Supabase Database**: Secure, scalable backend with real-time data synchronization
- 👤 **User Authentication**: Secure user management with Supabase Auth
- 📊 **Nutrition Tracking**: Comprehensive meal logging with calories, macros, and portion sizes
- 💪 **Workout Tracking**: Local workout logging with duration, calories burned, and notes
- 📱 **Responsive Design**: Modern, mobile-friendly interface
- 🔒 **Security**: Row Level Security (RLS) policies for data protection

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **AI**: Google Gemini AI for image analysis
- **Styling**: CSS Modules
- **Charts**: Recharts for data visualization

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://adxtkbhtezlzuydrzmcx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHRrYmh0ZXpsenV5ZHJ6bWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzc0NjIsImV4cCI6MjA3MDkxMzQ2Mn0.IEQZLSHdJ8nyz8-Hc8wxgHhPHu7slcL3vkeFSBjKsx0

# Gemini AI Configuration
VITE_GEMINI_API_KEY=AIzaSyD1F8_nwp5dz9KG3RtHe12iHYNjvwSKizs

# Workout Tracking
# Local workout tracking system integrated with Supabase
```

**Note**: Workout tracking is now handled locally through Supabase instead of external APIs.

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Fill in your actual values in the `.env` file:

```env
SUPABASE_URL=https://adxtkbhtezlzuydrzmcx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHRrYmh0ZXpsenV5ZHJ6bWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzc0NjIsImV4cCI6MjA3MDkxMzQ2Mn0.IEQZLSHdJ8nyz8-Hc8wxgHhPHu7slcL3vkeFSBjKsx0
GEMINI_API_KEY=AIzaSyD1F8_nwp5dz9KG3RtHe12iHYNjvwSKizs
```

### 2. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to the SQL Editor
3. Run the SQL commands from `database-schema.sql` to create tables and policies

### 3. Install Dependencies

```bash
npm install
```

### 4. Development

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
nutrisnap/
├── components/          # React components
│   ├── AuthView.tsx    # Authentication interface
│   ├── BottomNav.tsx   # Navigation component
│   ├── icons/          # SVG icons
│   └── Loader.tsx      # Loading component
├── services/            # API and service layer
│   ├── geminiService.ts    # Google Gemini AI integration
│   └── supabaseService.ts  # Supabase database operations
├── types.ts             # TypeScript type definitions
├── utils/               # Utility functions
├── database-schema.sql  # Database setup SQL
└── SETUP.md            # Detailed setup instructions
```

## API Services

### Gemini AI Service (`services/geminiService.ts`)
- Analyzes food images using Google's Gemini AI
- Extracts nutritional information (calories, protein, carbs, fat)
- Returns structured data for meal logging

### Supabase Service (`services/supabaseService.ts`)
- **Meal Management**: CRUD operations for meal entries
- **User Profiles**: Health metrics and goals management
- **Authentication**: User sign-in/sign-out functionality
- **Security**: Row Level Security policies

## Database Schema

### Tables

#### `meals`
- `id`: Unique identifier (UUID)
- `user_id`: Reference to authenticated user
- `meal_name`: Descriptive name of the meal
- `calories`, `protein`, `carbs`, `fat`: Nutritional values
- `portion_size`: Estimated portion size
- `image_url`: Base64 or URL of the food image
- `date`: Date of the meal
- `created_at`, `updated_at`: Timestamps

#### `profiles`
- `id`: Unique identifier (UUID)
- `user_id`: Reference to authenticated user
- `name`, `age`, `weight_kg`, `height_cm`: Personal information
- `activity_level`: Activity level for calorie calculations
- `daily_calorie_goal`: Target daily calorie intake

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication Required**: All database operations require valid user session
- **Input Validation**: Type-safe data handling with TypeScript
- **Secure API Keys**: Environment variable configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the [SETUP.md](SETUP.md) for detailed configuration
2. Review the database schema in [database-schema.sql](database-schema.sql)
3. Open an issue in the repository
