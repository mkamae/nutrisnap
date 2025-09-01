import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MealEntry } from '../types';
import { analyzeImageWithGemini } from '../services/geminiService';
import { imageStorageService } from '../services/imageStorageService';
import { fileToBase64 } from '../utils/helpers';
import Loader from './Loader';
import CameraIcon from './icons/CameraIcon';

interface AddMealViewProps {
  onConfirm: (meal: Omit<MealEntry, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  currentUserId?: string | null;
}

const AddMealView: React.FC<AddMealViewProps> = ({ onConfirm, onCancel, currentUserId }) => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    } else if (!isCameraOpen && videoRef.current) {
      // Clear the video source when camera is closed
      videoRef.current.srcObject = null;
    }
  }, [isCameraOpen]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setAnalysisResult(null);
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
  };
  
  const handleStartCamera = async () => {
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
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    } else {
      setError("Camera is not supported on this device.");
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
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
    
    if (!currentUserId) {
      setError("Please log in to analyze meals.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      const base64Image = await fileToBase64(imageFile);
      const result = await analyzeImageWithGemini(base64Image, imageFile.type);
      setAnalysisResult(result);
      
      // Upload image to permanent storage after successful analysis
      setIsUploading(true);
      const uploadResult = await imageStorageService.uploadImage(imageFile, currentUserId);
      
      if (uploadResult.success) {
        setUploadedImageUrl(uploadResult.url!);
      }
      
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!analysisResult) {
      setError('No analysis result available. Please analyze an image first.');
      return;
    }
    
    if (!currentUserId) {
      setError('No authenticated user found. Please log in.');
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
      let finalImageUrl = uploadedImageUrl;
      
      // If we don't have an uploaded URL but have an image file, upload it now
      if (!finalImageUrl && imageFile) {
        const uploadResult = await imageStorageService.uploadImage(imageFile, currentUserId);
        
        if (!uploadResult.success) {
          throw new Error(`Image upload failed: ${uploadResult.error}`);
        }
        
        finalImageUrl = uploadResult.url!;
        setUploadedImageUrl(finalImageUrl);
      }
      
      // Ensure all numeric fields have proper values
      const meal: Omit<MealEntry, 'id' | 'created_at'> = {
        mealName: analysisResult.mealName.trim(),
        calories: Math.max(0, analysisResult.calories || 0),
        protein: Math.max(0, analysisResult.protein || 0),
        carbs: Math.max(0, analysisResult.carbs || 0),
        fat: Math.max(0, analysisResult.fat || 0),
        portionSize: analysisResult.portionSize?.trim() || '1 serving',
        imageUrl: finalImageUrl || previewUrl, // Fallback to preview URL if upload fails
        date: new Date().toISOString().split('T')[0]
      };
      
      // Call the parent's onConfirm function
      await onConfirm(meal);
      
      // Show success state briefly, then navigate back
      setIsSuccess(true);
      
      // Navigate back to dashboard after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
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
                    disabled={isLoading || isUploading}
                    className="btn-primary"
                  >
                    {isLoading ? 'Analyzing...' : isUploading ? 'Uploading...' : 'Analyze Image'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Results</h3>
              
              {/* Image Upload Status */}
              <div className="mb-4 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Image Storage:
                  </span>
                  <div className="flex items-center">
                    {uploadedImageUrl ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Uploaded to permanent storage</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Using temporary storage</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Display Analysis Results (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Meal Name</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {analysisResult.mealName || 'Analyzed meal'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Portion Size</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {analysisResult.portionSize || '1 serving'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Calories</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {analysisResult.calories || 0} kcal
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Protein (g)</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {analysisResult.protein || 0}g
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Carbs (g)</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {analysisResult.carbs || 0}g
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Fat (g)</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {analysisResult.fat || 0}g
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
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
                    {isConfirming ? 'Saving...' : 'Save Meal'}
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
        </div>
      </div>
    </div>
  );
};

export default AddMealView;