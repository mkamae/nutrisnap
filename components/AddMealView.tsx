import React, { useState, useRef, useEffect } from 'react';
import { MealEntry } from '../types';
import { analyzeImageWithGemini } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import Loader from './Loader';
import CameraIcon from './icons/CameraIcon';

interface AddMealViewProps {
  onConfirm: (meal: Omit<MealEntry, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

const AddMealView: React.FC<AddMealViewProps> = ({ onConfirm, onCancel }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

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

  const handleConfirm = () => {
    if (analysisResult && previewUrl) {
      const meal: Omit<MealEntry, 'id' | 'created_at'> = {
        mealName: analysisResult.mealName,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        portionSize: analysisResult.portionSize,
        imageUrl: previewUrl,
        date: new Date().toISOString().split('T')[0]
      };
      onConfirm(meal);
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
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Meal</h1>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Image Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          {previewUrl ? (
            <div className="w-full">
              <img src={previewUrl} alt="Meal preview" className="w-full h-48 object-cover rounded-lg mb-4" />
              <button 
                onClick={handleClearSelection} 
                className="w-full text-center text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                Choose a different image
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-700 dark:text-gray-300">
                Add a Meal Photo
              </h3>
              <div className="space-y-3">
                <label htmlFor="meal-upload" className="w-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Upload from Library</span>
                </label>
                <input id="meal-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                
                <button 
                  onClick={handleStartCamera} 
                  className="w-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <CameraIcon className="h-12 w-12 text-gray-500 dark:text-gray-400"/>
                  <span className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Use Camera</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Debug Info */}
        {debugInfo && (
          <p className="text-xs text-gray-500 text-center mb-4 bg-gray-100 dark:bg-gray-700 p-2 rounded">
            {debugInfo}
          </p>
        )}
        
        {/* Analyze Button */}
        {previewUrl && !analysisResult && (
          <button
            onClick={handleAnalyze}
            disabled={!imageFile || isLoading}
            className="w-full mb-6 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Meal'}
          </button>
        )}

        {/* Loading State */}
        {isLoading && <Loader />}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 animate-fade-in">
            <h3 className="text-xl font-bold text-center mb-3">{analysisResult.mealName}</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-4">{analysisResult.portionSize}</p>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">Calories</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analysisResult.calories}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">Protein</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {analysisResult.protein}g
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">Carbs</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {analysisResult.carbs}g
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-300">Fat</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {analysisResult.fat}g
                </p>
              </div>
            </div>
            
            <button
              onClick={handleConfirm}
              className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Confirm & Add Meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMealView;
