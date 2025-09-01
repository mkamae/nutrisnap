import React, { useState } from 'react';
import { imageStorageService } from '../services/imageStorageService';
import { supabase } from '../services/supabaseService';

const StorageTester: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [testFile, setTestFile] = useState<File | null>(null);

  const runStorageTests = async () => {
    setIsRunning(true);
    const results: any = {};
    
    try {
      console.log('🧪 Running storage tests...');
      
      // Test 1: Check authentication
      console.log('Test 1: Check authentication');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.auth = {
        authenticated: !!user,
        userId: user?.id,
        error: authError?.message
      };

      // Test 2: Check storage bucket exists
      console.log('Test 2: Check storage bucket');
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        const mealImagesBucket = buckets?.find(b => b.id === 'meal-images');
        
        results.bucket = {
          exists: !!mealImagesBucket,
          bucketInfo: mealImagesBucket,
          error: bucketError?.message,
          allBuckets: buckets?.map(b => b.id)
        };
      } catch (err: any) {
        results.bucket = { exists: false, error: err.message };
      }

      // Test 3: Test bucket creation (if needed)
      console.log('Test 3: Ensure bucket exists');
      if (user) {
        try {
          const bucketReady = await imageStorageService.ensureStorageBucket();
          results.bucketSetup = {
            success: bucketReady,
            message: bucketReady ? 'Bucket ready' : 'Bucket setup failed'
          };
        } catch (err: any) {
          results.bucketSetup = { success: false, error: err.message };
        }
      }

      // Test 4: Test file upload (if user is authenticated and file is selected)
      console.log('Test 4: Test file upload');
      if (user && testFile) {
        try {
          const uploadResult = await imageStorageService.uploadImage(testFile, user.id);
          results.upload = {
            success: uploadResult.success,
            url: uploadResult.url,
            error: uploadResult.error
          };

          // Test 5: Test file deletion (cleanup)
          if (uploadResult.success && uploadResult.url) {
            console.log('Test 5: Test file deletion');
            const deleteResult = await imageStorageService.deleteImage(uploadResult.url);
            results.delete = {
              success: deleteResult,
              message: deleteResult ? 'File deleted successfully' : 'File deletion failed'
            };
          }
        } catch (err: any) {
          results.upload = { success: false, error: err.message };
        }
      } else if (!testFile) {
        results.upload = { success: false, error: 'No test file selected' };
      }

      // Test 6: List files in bucket
      console.log('Test 6: List files in bucket');
      if (user) {
        try {
          const { data: files, error: listError } = await supabase.storage
            .from('meal-images')
            .list(user.id, { limit: 5 });
          
          results.listFiles = {
            success: !listError,
            error: listError?.message,
            fileCount: files?.length || 0,
            files: files?.map(f => f.name) || []
          };
        } catch (err: any) {
          results.listFiles = { success: false, error: err.message };
        }
      }

    } catch (error: any) {
      results.generalError = error.message;
    }
    
    console.log('🔍 Storage test results:', results);
    setTestResults(results);
    setIsRunning(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTestFile(e.target.files[0]);
    }
  };

  const createTestImage = () => {
    // Create a simple test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 1, 1);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'test-image.png', { type: 'image/png' });
          setTestFile(file);
        }
      }, 'image/png');
    }
  };

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-bold text-blue-800 mb-4">
        📁 Storage Tester
      </h3>
      
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test File (optional):
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={createTestImage}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Create Test Image
            </button>
          </div>
          {testFile && (
            <p className="text-xs text-gray-600 mt-1">
              Selected: {testFile.name} ({testFile.size} bytes)
            </p>
          )}
        </div>
        
        <button
          onClick={runStorageTests}
          disabled={isRunning}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Test Storage'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-3">
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
            <div key={testName} className="p-3 bg-white border rounded">
              <h4 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
              <div className="text-sm mt-1">
                {result.success !== undefined && (
                  <div className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '✅' : '❌'} 
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                )}
                {result.error && (
                  <div className="text-red-600">Error: {result.error}</div>
                )}
                {result.authenticated !== undefined && (
                  <div>Authenticated: {result.authenticated ? 'Yes' : 'No'}</div>
                )}
                {result.userId && (
                  <div className="text-xs">User ID: {result.userId}</div>
                )}
                {result.exists !== undefined && (
                  <div>Bucket Exists: {result.exists ? 'Yes' : 'No'}</div>
                )}
                {result.url && (
                  <div className="text-xs">
                    URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {result.url.substring(0, 50)}...
                    </a>
                  </div>
                )}
                {result.fileCount !== undefined && (
                  <div>Files in bucket: {result.fileCount}</div>
                )}
                {result.message && (
                  <div className="text-gray-600">{result.message}</div>
                )}
                {result.allBuckets && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">View All Buckets</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                      {JSON.stringify(result.allBuckets, null, 2)}
                    </pre>
                  </details>
                )}
                {result.files && result.files.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">View Files</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                      {JSON.stringify(result.files, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800">Setup Instructions:</h4>
        <ol className="text-sm text-yellow-700 mt-1 space-y-1 list-decimal list-inside">
          <li>Run the storage-setup.sql script in Supabase SQL Editor</li>
          <li>Ensure you're authenticated in the app</li>
          <li>Test with a small image file</li>
          <li>Check that the bucket policies allow your user to upload</li>
        </ol>
      </div>
    </div>
  );
};

export default StorageTester;