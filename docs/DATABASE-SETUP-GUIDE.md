# NutriSnap Database Setup Guide

This guide will walk you through setting up your Supabase database for the NutriSnap application.

## Prerequisites

- Access to your Supabase project dashboard
- Basic understanding of SQL (optional, but helpful)

## Step-by-Step Setup

### 1. Access Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Navigate to your project: `adxtkbhtezlzuydrzmcx`
3. Click on the project to open the dashboard

### 2. Open the SQL Editor

1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New Query"** to create a new SQL script

### 3. Run the Database Setup Script

1. Copy the entire contents of `database-setup-simple.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script

### 4. Verify the Setup

After running the script, you should see:
- ✅ All tables created successfully
- ✅ Row Level Security (RLS) enabled
- ✅ Policies created
- ✅ Indexes created
- ✅ Sample data inserted
- ✅ Views created

### 5. Check Your Tables

In the left sidebar, click on **"Table Editor"** to verify:
- `users` - User accounts
- `profiles` - User profile information
- `meals` - Meal entries with nutrition data
- `food_items` - Common food database
- `weight_logs` - Weight tracking
- `water_logs` - Water intake tracking

## What Gets Created

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts | Extends Supabase auth |
| `profiles` | Health profiles | Goals, measurements |
| `meals` | Meal tracking | AI-analyzed nutrition |
| `food_items` | Food database | Verified nutrition data |
| `weight_logs` | Weight tracking | Progress monitoring |
| `water_logs` | Hydration tracking | Daily water intake |

### Security Features

- **Row Level Security (RLS)**: Users can only see their own data
- **Authentication Required**: All operations require valid user session
- **Data Isolation**: Complete privacy between users

### Performance Features

- **Indexes**: Fast queries on common fields
- **Views**: Pre-built queries for common operations
- **Triggers**: Automatic timestamp updates

## Testing the Setup

### 1. Create a Test User

1. Go to **"Authentication"** → **"Users"**
2. Click **"Add User"**
3. Enter test email and password

### 2. Test Data Access

1. Sign in with the test user
2. Try to access the app
3. Verify that data is properly isolated

## Troubleshooting

### Common Issues

#### "Extension not found"
- Make sure you're running the script in the correct Supabase project
- Extensions are automatically enabled in Supabase

#### "Permission denied"
- Check that RLS policies are properly created
- Verify user authentication is working

#### "Table already exists"
- This is normal - the script uses `IF NOT EXISTS`
- Tables won't be recreated if they already exist

### If Something Goes Wrong

1. **Check the SQL Editor logs** for specific error messages
2. **Verify table creation** in the Table Editor
3. **Check RLS policies** in the Authentication section
4. **Run individual commands** if needed

## Next Steps

After successful database setup:

1. **Test the app** - Try uploading an image and analyzing it
2. **Create a real user account** - Set up your profile
3. **Add some meals** - Test the full workflow
4. **Monitor performance** - Check query performance in the logs

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the error logs in the SQL Editor
3. Verify your environment variables are correct
4. Ensure your Supabase project is active and accessible

## Database Schema Overview

```
users (extends auth.users)
├── profiles (user health data)
├── meals (nutrition tracking)
├── weight_logs (progress tracking)
├── water_logs (hydration)
└── food_items (nutrition database)
```

Your NutriSnap app is now ready with a fully functional, secure database backend! 🎉
