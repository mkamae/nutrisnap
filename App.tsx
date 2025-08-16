import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { View, MealEntry, UserProfile, Nutrients } from './types';
import BottomNav from './components/BottomNav';
import { analyzeImageWithGemini } from './services/geminiService';
import { fileToBase64 } from './utils/helpers';
import Loader from './components/Loader';
import AuthView from './components/AuthView';
import CameraIcon from './components/icons/CameraIcon';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [userProfile] = useState<UserProfile>({
    name: 'Alex',
    age: 30,
    weightKg: 75,
    heightCm: 180,
    activityLevel: 'moderate',
    dailyCalorieGoal: 2500,
  });

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    // In a real app, this would also clear tokens, etc.
    setIsAuthenticated(false);
    // Reset to dashboard view for next login
    setCurrentView('dashboard');
  };

  const addMealEntry = (nutrients: Nutrients, imageUrl: string) => {
    const newEntry: MealEntry = {
      ...nutrients,
      id: new Date().toISOString() + Math.random(),
      date: new Date().toISOString(),
      imageUrl,
    };
    setMealEntries(prev => [newEntry, ...prev]);
    setCurrentView('dashboard');
  };

  const todaysEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return mealEntries.filter(entry => entry.date.startsWith(today));
  }, [mealEntries]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView entries={todaysEntries} profile={userProfile} />;
      case 'add_meal':
        return <AddMealView onAddMeal={addMealEntry} />;
      case 'progress':
        return <ProgressView entries={mealEntries} calorieGoal={userProfile.dailyCalorieGoal} />;
      case 'profile':
        return <ProfileView profile={userProfile} onLogout={handleLogout} />;
      default:
        return <DashboardView entries={todaysEntries} profile={userProfile} />;
    }
  };

  if (!isAuthenticated) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-800 dark:text-gray-200">
      <div className="max-w-lg mx-auto pb-20">
        <Header view={currentView} />
        <main className="p-4">
          {renderView()}
        </main>
      </div>
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

// --- VIEWS / PAGES ---

const Header: React.FC<{ view: View }> = ({ view }) => {
  const title = view.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg z-10 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-lg mx-auto px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">{title}</h1>
      </div>
    </header>
  )
}

const DashboardView: React.FC<{ entries: MealEntry[], profile: UserProfile }> = ({ entries, profile }) => {
  const totals = useMemo(() => {
    return entries.reduce((acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [entries]);

  const macroData = [
    { name: 'Protein', value: totals.protein, color: '#34D399' },
    { name: 'Carbs', value: totals.carbs, color: '#60A5FA' },
    { name: 'Fat', value: totals.fat, color: '#FBBF24' },
  ];

  const caloriesLeft = profile.dailyCalorieGoal - totals.calories;

  return (
    <div className="space-y-6">
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <p className="text-gray-500 dark:text-gray-400">Calories Remaining</p>
        <div className="flex justify-center items-baseline space-x-2 mt-2">
            <span className="text-4xl font-extrabold text-green-500">{Math.max(0, caloriesLeft)}</span>
            <span className="text-lg text-gray-600 dark:text-gray-300">/ {profile.dailyCalorieGoal} kcal</span>
        </div>
      </div>

      {totals.calories > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-2 text-center">Today's Macros</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {macroData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value}g`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">Today's Meals</h3>
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <img src={entry.imageUrl} alt={entry.mealName} className="w-16 h-16 rounded-lg object-cover mr-4" />
                <div className="flex-1">
                  <p className="font-bold">{entry.mealName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{entry.calories} kcal &bull; {entry.portionSize}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No meals logged yet today.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Add your first meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AddMealView: React.FC<{ onAddMeal: (nutrients: Nutrients, imageUrl: string) => void }> = ({ onAddMeal }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Nutrients | null>(null);
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
      onAddMeal(analysisResult, previewUrl);
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
    <div className="flex flex-col items-center space-y-4">
      <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        
        {previewUrl ? (
           <div className="w-full">
             <img src={previewUrl} alt="Meal preview" className="w-full h-48 object-cover rounded-lg mb-2" />
             <button onClick={handleClearSelection} className="w-full text-center text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
              Choose a different image
            </button>
           </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-700 dark:text-gray-300">Add a Meal Photo</h3>
            <div className="space-y-3">
              <label htmlFor="meal-upload" className="w-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 <span className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Upload from Library</span>
              </label>
              <input id="meal-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <button onClick={handleStartCamera} className="w-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <CameraIcon className="h-12 w-12 text-gray-500 dark:text-gray-400"/>
                <span className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Use Camera</span>
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        
        {debugInfo && (
          <p className="text-xs text-gray-500 text-center mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
            {debugInfo}
          </p>
        )}
        
        {previewUrl && !analysisResult && (
          <button
            onClick={handleAnalyze}
            disabled={!imageFile || isLoading}
            className="w-full mt-4 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Meal'}
          </button>
        )}
      </div>

      {isLoading && <Loader />}

      {analysisResult && (
        <div className="w-full max-w-sm p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-3">{analysisResult.mealName}</h3>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-4">{analysisResult.portionSize}</p>
          <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-300">Calories</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analysisResult.calories}</p>
              </div>
              <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">Carbs</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{analysisResult.carbs}g</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">Protein</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{analysisResult.protein}g</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <p className="text-sm text-amber-800 dark:amber-300">Fat</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{analysisResult.fat}g</p>
              </div>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full mt-4 bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Confirm & Add Meal
          </button>
        </div>
      )}
    </div>
  );
};

const ProgressView: React.FC<{ entries: MealEntry[], calorieGoal: number }> = ({ entries, calorieGoal }) => {
   const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(dateStr => {
      const dayEntries = entries.filter(e => e.date.startsWith(dateStr));
      const totalCalories = dayEntries.reduce((sum, e) => sum + e.calories, 0);
      return {
        name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        Intake: totalCalories,
        Goal: calorieGoal,
      };
    });
  }, [entries, calorieGoal]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">Weekly Calorie Intake</h3>
      {entries.length > 0 ? (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Intake" fill="#34D399" />
              <Bar dataKey="Goal" fill="#60A5FA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Log some meals to see your progress!</p>
      )}
    </div>
  );
};

const ProfileView: React.FC<{ profile: UserProfile, onLogout: () => void }> = ({ profile, onLogout }) => {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md flex items-center space-x-4">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">Your personal profile</p>
        </div>
      </div>
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4">Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500 dark:text-gray-400">Age</p><p>{profile.age} years</p></div>
          <div><p className="text-sm text-gray-500 dark:text-gray-400">Weight</p><p>{profile.weightKg} kg</p></div>
          <div><p className="text-sm text-gray-500 dark:text-gray-400">Height</p><p>{profile.heightCm} cm</p></div>
          <div><p className="text-sm text-gray-500 dark:text-gray-400">Activity Level</p><p className="capitalize">{profile.activityLevel.replace('_', ' ')}</p></div>
        </div>
      </div>
       <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-2">Daily Goal</h3>
        <p className="text-3xl font-bold text-green-500">{profile.dailyCalorieGoal} <span className="text-lg">kcal</span></p>
      </div>
      <div className="pt-2">
        <button
            onClick={onLogout}
            className="w-full text-center py-3 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-200"
        >
            Sign Out
        </button>
      </div>
    </div>
  );
};

export default App;