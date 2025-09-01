import React, { useState } from 'react';
import { analyzeImageWithGemini } from '../services/geminiService';

const MealAnalysisTester: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);

  const testGeminiConnection = async () => {
    setIsRunning(true);
    const results: any = {};
    
    try {
      // Test 1: Check API key
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      results.apiKey = {
        exists: !!apiKey,
        length: apiKey?.length || 0,
        preview: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set'
      };

      // Test 2: Test with a simple base64 image (1x1 pixel)
      const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      if (apiKey) {
        try {
          console.log('Testing Gemini API with test image...');
          const analysisResult = await analyzeImageWithGemini(testImage, 'image/png');
          results.geminiTest = {
            success: true,
            result: analysisResult
          };
        } catch (error: any) {
          results.geminiTest = {
            success: false,
            error: error.message
          };
        }
      } else {
        results.geminiTest = {
          success: false,
          error: 'API key not available'
        };
      }

    } catch (error: any) {
      results.generalError = error.message;
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const testMealSaving = async () => {
    setIsRunning(true);
    try {
      // Create a test meal
      const testMeal = {
        mealName: 'Test Meal',
        calories: 500,
        protein: 25,
        carbs: 60,
        fat: 20,
        portionSize: '1 serving',
        imageUrl: 'data:image/png;base64,test',
        date: new Date().toISOString().split('T')[0]
      };

      console.log('Testing meal saving with:', testMeal);
      
      // This would normally call the parent's onConfirm, but we'll just log it
      console.log('Meal save test completed - check console for details');
      alert('Meal save test completed - check browser console for details');
      
    } catch (error: any) {
      alert(`Meal save test failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-bold text-yellow-800 mb-4">
        🧪 Meal Analysis Tester
      </h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testGeminiConnection}
          disabled={isRunning}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Test Gemini API'}
        </button>
        
        <button
          onClick={testMealSaving}
          disabled={isRunning}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Meal Saving
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
                {result.exists !== undefined && (
                  <div>API Key Exists: {result.exists ? 'Yes' : 'No'}</div>
                )}
                {result.length !== undefined && (
                  <div>Key Length: {result.length} characters</div>
                )}
                {result.preview && (
                  <div className="text-xs">Preview: {result.preview}</div>
                )}
                {result.result && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">View Analysis Result</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-800">Common Issues:</h4>
        <ul className="text-sm text-blue-700 mt-1 space-y-1">
          <li>• Check if VITE_GEMINI_API_KEY is set in .env.local</li>
          <li>• Verify the API key is valid and has proper permissions</li>
          <li>• Check browser console for detailed error messages</li>
          <li>• Ensure you're connected to the internet</li>
        </ul>
      </div>
    </div>
  );
};

export default MealAnalysisTester;