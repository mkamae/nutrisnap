import React, { useState } from 'react';
import { imageStorageService } from '../services/imageStorageService';

interface StorageDebuggerProps {
  currentUserId: string | null;
}

const StorageDebugger: React.FC<StorageDebuggerProps> = ({ currentUserId }) => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testStorageBucket = async () => {
    if (!currentUserId) {
      setResult('❌ No user ID available');
      return;
    }

    setIsLoading(true);
    setResult('🔄 Testing storage bucket...');

    try {
      // Test bucket existence
      const bucketExists = await imageStorageService.ensureStorageBucket();
      
      if (!bucketExists) {
        setResult('❌ Storage bucket not accessible. Please check Supabase dashboard.');
        return;
      }

      // Create a test image (1x1 pixel red PNG)
      const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      console.log('🧪 Testing image upload...');
      const uploadResult = await imageStorageService.uploadBase64Image(
        testImageData,
        'image/png',
        currentUserId
      );

      if (uploadResult.success && uploadResult.url) {
        setResult(`✅ Storage test successful!
        
🪣 Bucket: meal-images
🔗 Test image URL: ${uploadResult.url}
📁 User folder: ${currentUserId}
        
The storage is properly configured and ready to use.`);
      } else {
        setResult(`❌ Storage test failed: ${uploadResult.error}`);
      }

    } catch (error: any) {
      console.error('❌ Storage test error:', error);
      setResult(`❌ Storage test error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3">
        🪣 Storage Bucket Test
      </h3>
      
      <div className="space-y-3">
        <button
          onClick={testStorageBucket}
          disabled={isLoading || !currentUserId}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '⏳ Testing...' : '🧪 Test Storage'}
        </button>

        {result && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Storage bucket accessibility</li>
            <li>Image upload functionality</li>
            <li>Public URL generation</li>
            <li>User-specific folder structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StorageDebugger;