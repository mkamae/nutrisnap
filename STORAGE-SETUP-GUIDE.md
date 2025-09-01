# Supabase Storage Setup Guide

## 🎯 Quick Setup (Recommended)

### Option 1: Supabase Dashboard (Easiest)

1. **Go to your Supabase project dashboard**
2. **Navigate to Storage section**
3. **Create a new bucket:**
   - Name: `meal-images`
   - Public: ✅ Yes
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/jpg`

4. **Set up RLS Policies:**
   - Go to the `meal-images` bucket
   - Click on "Policies" tab
   - Add these 4 policies:

#### Policy 1: Users can upload meal images
- **Operation:** INSERT
- **Policy:** `auth.uid()::text = (storage.foldername(name))[1]`

#### Policy 2: Users can view their own meal images
- **Operation:** SELECT  
- **Policy:** `auth.uid()::text = (storage.foldername(name))[1]`

#### Policy 3: Users can delete their own meal images
- **Operation:** DELETE
- **Policy:** `auth.uid()::text = (storage.foldername(name))[1]`

#### Policy 4: Public read access for meal images
- **Operation:** SELECT
- **Policy:** `bucket_id = 'meal-images'`

---

### Option 2: SQL + Manual Policies

1. **Run this SQL in Supabase SQL Editor:**

```sql
-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-images',
  'meal-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT 'Bucket created!' as status, 
       EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'meal-images') as bucket_exists;
```

2. **Then follow step 4 from Option 1** to create the RLS policies manually.

---

## 🧪 Testing Your Setup

After setup, use the **StorageTester** component in the app:

1. Go to `/add-meal` in your app
2. Find the "Storage Tester" section
3. Click "Test Storage" to verify everything works
4. Upload a test image to confirm functionality

---

## 🔧 Troubleshooting

### Common Issues:

**❌ "Bucket not found"**
- Solution: Create the bucket in Supabase Dashboard

**❌ "Permission denied" on upload**
- Solution: Check RLS policies are created correctly
- Ensure you're authenticated in the app

**❌ "File too large"**
- Solution: Check file size limit (5MB max)

**❌ "Invalid file type"**
- Solution: Only JPEG, PNG, WebP images are allowed

### Debug Steps:

1. **Check bucket exists:** Use StorageTester
2. **Verify authentication:** Ensure user is logged in
3. **Test policies:** Try uploading a small test image
4. **Check console:** Look for detailed error messages

---

## 📁 How It Works

### File Structure:
```
meal-images/
├── [user-id-1]/
│   ├── 1234567890-abc123.jpg
│   └── 1234567890-def456.png
└── [user-id-2]/
    ├── 1234567890-ghi789.jpg
    └── 1234567890-jkl012.png
```

### Security:
- Each user can only access their own folder
- Files are organized by user ID
- Public read access for sharing (but folder-restricted)
- Automatic cleanup when users are deleted

---

## ✅ Verification

After setup, you should see:
- ✅ Bucket exists in Supabase Storage
- ✅ 4 RLS policies created
- ✅ StorageTester shows all green checkmarks
- ✅ Image uploads work in AddMealView
- ✅ Permanent URLs are generated for images