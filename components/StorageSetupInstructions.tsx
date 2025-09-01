import React, { useState } from 'react';

const StorageSetupInstructions: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  const sqlScript = `-- SUPABASE STORAGE SETUP FOR MEAL IMAGES
-- Step 1: Run this in Supabase SQL Editor to create the bucket

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
       EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'meal-images') as bucket_exists;`;

  const policyInstructions = `Step 2: Create these 4 policies in Supabase Dashboard (Storage → meal-images → Policies):

Policy 1: "Users can upload meal images"
- Operation: INSERT
- Policy: auth.uid()::text = (storage.foldername(name))[1]

Policy 2: "Users can view their own meal images" 
- Operation: SELECT
- Policy: auth.uid()::text = (storage.foldername(name))[1]

Policy 3: "Users can delete their own meal images"
- Operation: DELETE  
- Policy: auth.uid()::text = (storage.foldername(name))[1]

Policy 4: "Public read access for meal images"
- Operation: SELECT
- Policy: bucket_id = 'meal-images'`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      alert('SQL script copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  return (
    <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-lg font-bold text-green-800 mb-4">
        🛠️ Storage Setup Required
      </h3>
      
      <div className="space-y-4">
        <p className="text-green-700">
          To enable permanent image storage, you need to set up a Supabase storage bucket.
        </p>
        
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showInstructions ? 'Hide Instructions' : 'Show Setup Instructions'}
        </button>
        
        {showInstructions && (
          <div className="space-y-4">
            <div className="bg-white border border-green-200 rounded p-4">
              <h4 className="font-semibold text-green-800 mb-2">Step-by-Step Setup:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-green-700">
                <li><strong>Create the bucket:</strong> Run the SQL script below in Supabase SQL Editor</li>
                <li><strong>Set up policies:</strong> Go to Storage → meal-images → Policies in Supabase Dashboard</li>
                <li><strong>Add the 4 policies</strong> listed in the script comments</li>
                <li><strong>Test:</strong> Refresh this page and use the Storage Tester</li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h5 className="font-semibold text-yellow-800 mb-1">⚠️ Important Note:</h5>
              <p className="text-sm text-yellow-700">
                Due to Supabase security restrictions, storage policies must be created through the Dashboard UI, not SQL.
                The script below creates the bucket, but you'll need to add policies manually.
              </p>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Step 1 - SQL Script:</span>
                <button
                  onClick={copyToClipboard}
                  className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                >
                  Copy SQL
                </button>
              </div>
              <pre className="whitespace-pre-wrap">{sqlScript}</pre>
            </div>
            
            <div className="bg-gray-100 text-gray-800 p-4 rounded text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Step 2 - Manual Policy Setup:</span>
                <button
                  onClick={() => navigator.clipboard.writeText(policyInstructions)}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Copy Instructions
                </button>
              </div>
              <pre className="whitespace-pre-wrap">{policyInstructions}</pre>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h5 className="font-semibold text-blue-800 mb-1">What this does:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Creates a public storage bucket called "meal-images"</li>
                <li>• Sets up Row Level Security (RLS) policies</li>
                <li>• Allows users to upload, view, and delete their own images</li>
                <li>• Limits file size to 5MB and allows common image formats</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageSetupInstructions;