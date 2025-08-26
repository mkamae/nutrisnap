import React, { useState, useRef, useEffect } from 'react';
import { MealEntry } from '../types';
import { analyzeImageWithGemini } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import Loader from './Loader';
import CameraIcon from './icons/CameraIcon';

interface AddMealViewProps {
  onConfirm: (meal: Omit<MealEntry, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

const AddMealView: React.FC<AddMealViewProps> = ({ onConfirm, onCancel }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Selected file:', file.name, file.type, file.size);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setAnalysisResult(null);
      setDebugInfo(`File selected: ${file.name} (${file.type})`);
    }
  };
  
  const handleClearSelection = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    setAnalysisResult(null);
    setDebugInfo('');
  };
  
  const handleStartCamera = async () => {
    console.log('Starting camera...');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        streamRef.current = stream;
        setIsCameraOpen(true);
        setDebugInfo('Camera started successfully');
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
        setDebugInfo(`Camera error: ${err}`);
      }
    } else {
      setError("Camera is not supported on this device.");
      setDebugInfo('Camera not supported');
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setDebugInfo('Camera stopped');
  };

  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `nutrisnap-${Date.now()}.jpg`, { type: 'image/jpeg' });
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAnalysisResult(null);
            setError(null);
            setDebugInfo(`Photo taken: ${file.name} (${file.size} bytes)`);
            handleStopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setDebugInfo('Starting analysis...');
    
    try {
      console.log('Converting file to base64...');
      const base64Image = await fileToBase64(imageFile);
      console.log('Base64 length:', base64Image.length);
      setDebugInfo('Image converted, calling Gemini...');
      
      const result = await analyzeImageWithGemini(base64Image, imageFile.type);
      console.log('Analysis result:', result);
      setAnalysisResult(result);
      setDebugInfo('Analysis completed successfully');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || "An unknown error occurred.");
      setDebugInfo(`Analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    console.log('=== HANDLE CONFIRM DEBUG ===');
    console.log('Analysis result:', analysisResult);
    console.log('Preview URL:', previewUrl);
    
    if (!analysisResult) {
      setError('No analysis result available. Please analyze an image first.');
      return;
    }
    
    if (!previewUrl) {
      setError('No image available. Please select an image first.');
      return;
    }
    
    // Validate required fields
    if (!analysisResult.mealName || !analysisResult.mealName.trim()) {
      setError('Please enter a meal name.');
      return;
    }
    
    if (!analysisResult.calories || analysisResult.calories <= 0) {
      setError('Please enter valid calories.');
      return;
    }
    
    setIsConfirming(true);
    setError(null);
    
    try {
      // Ensure all numeric fields have proper values
      const meal: Omit<MealEntry, 'id' | 'created_at'> = {
        mealName: analysisResult.mealName.trim(),
        calories: Math.max(0, analysisResult.calories || 0),
        protein: Math.max(0, analysisResult.protein || 0),
        carbs: Math.max(0, analysisResult.carbs || 0),
        fat: Math.max(0, analysisResult.fat || 0),
        portionSize: analysisResult.portionSize?.trim() || '1 serving',
        imageUrl: previewUrl,
        date: new Date().toISOString().split('T')[0]
      };
      
      console.log('Meal data to confirm:', meal);
      console.log('Calling onConfirm with meal:', meal);
      
      // Call the parent's onConfirm function
      await onConfirm(meal);
      
      console.log('Meal confirmed successfully!');
      
      // Show success state
      setIsSuccess(true);
      setDebugInfo('Meal added successfully! Redirecting...');
      
      // Clear the form after successful confirmation
      setTimeout(() => {
        setAnalysisResult(null);
        setImageFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setError(null);
        setIsSuccess(false);
        setIsConfirming(false);
        setDebugInfo('');
      }, 2000);
      
    } catch (error) {
      console.error('Error in handleConfirm:', error);
      setError(`Failed to add meal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConfirming(false);
    }
  };
  
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-center items-center">
          <button 
            onClick={handleTakePicture} 
            aria-label="Take picture"
            className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
          ></button>
          <button onClick={handleStopCamera} className="absolute right-6 text-white font-semibold text-lg">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Meal</h1>
          <p className="text-gray-600 dark:text-gray-400">Take a photo or upload an image to analyze your meal</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Image Upload Section */}
          <div className="card">
            <h2 className="card-header">Upload Image</h2>
            <p className="card-subtitle">Choose an image file or take a photo with your camera</p>
            
            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <label htmlFor="image-upload" className="form-label">
                  Select Image File
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-input"
                />
              </div>
              
              {/* Camera Button */}
              <div className="text-center">
                <button
                  onClick={isCameraOpen ? handleStopCamera : handleStartCamera}
                  className={`btn-primary flex items-center justify-center mx-auto ${
                    isCameraOpen ? 'bg-red-600 hover:bg-red-700' : ''
                  }`}
                >
                  <CameraIcon className="w-5 h-5 mr-2" />
                  {isCameraOpen ? 'Stop Camera' : 'Open Camera'}
                </button>
              </div>
            </div>
          </div>

          {/* Camera View */}
          {isCameraOpen && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Camera</h3>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={handleTakePicture}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 btn-primary"
                >
                  Take Picture
                </button>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {previewUrl && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Image Preview</h3>
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Meal preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleClearSelection}
                    className="btn-secondary"
                  >
                    Clear Image
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze Image'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Results</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Meal Name</label>
                    <input
                      type="text"
                      value={analysisResult.mealName || ''}
                      onChange={(e) => setAnalysisResult(prev => ({ ...prev, mealName: e.target.value }))}
                      className="form-input"
                      placeholder="Enter meal name"
                    />
                  </div>
                  <div>
                    <label className="form-label">Portion Size</label>
                    <input
                      type="text"
                      value={analysisResult.portionSize || ''}
                      onChange={(e) => setAnalysisResult(prev => ({ ...prev, portionSize: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., 1 cup, 200g"
                    />
                  </div>
                  <div>
                    <label className="form-label">Calories</label>
                    <input
                      type="number"
                      value={analysisResult.calories || ''}
                      onChange={(e) => setAnalysisResult(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={analysisResult.protein || ''}
                      onChange={(e) => setAnalysisResult(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={analysisResult.carbs || ''}
                      onChange={(e) => setAnalysisResult(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={analysisResult.fat || ''}
                      onChange={(e) => setAnalysisResult(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={onCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading || isConfirming}
                    className="btn-primary"
                  >
                    {isConfirming ? 'Adding...' : 'Add Meal'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            </div>
          )}

          {/* Success Display */}
          {isSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                Meal added successfully! Redirecting...
              </p>
            </div>
          )}

          {/* Debug Info (Development Only) */}
          {debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Debug: {debugInfo}
              </p>
            </div>
          )}

          {/* Test Button (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="card">
              <h3 className="card-header">Debug Tools</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    console.log('=== TEST MEAL DATA ===');
                    console.log('Current analysis result:', analysisResult);
                    console.log('Current preview URL:', previewUrl);
                    console.log('Current image file:', imageFile);
                    
                    // Create a test meal
                    const testMeal: Omit<MealEntry, 'id' | 'created_at'> = {
                      mealName: 'Test Meal',
                      calories: 500,
                      protein: 25,
                      carbs: 60,
                      fat: 20,
                      portionSize: '1 serving',
                      imageUrl: 'data:image/jpeg;base64,test',
                      date: new Date().toISOString().split('T')[0]
                    };
                    
                    console.log('Test meal data:', testMeal);
                    console.log('Calling onConfirm with test meal...');
                    
                    // Test the onConfirm function
                    onConfirm(testMeal).then(() => {
                      console.log('Test meal confirmed successfully!');
                      setDebugInfo('Test meal added successfully!');
                    }).catch((error) => {
                      console.error('Test meal failed:', error);
                      setError(`Test meal failed: ${error.message}`);
                    });
                  }}
                  className="btn-secondary w-full"
                >
                  Test Meal Addition
                </button>
                
                <button
                  onClick={() => {
                    setDebugInfo(`Analysis Result: ${JSON.stringify(analysisResult, null, 2)}`);
                  }}
                  className="btn-secondary w-full"
                >
                  Log Analysis Result
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMealView;
