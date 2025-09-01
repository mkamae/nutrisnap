import React, { useState, useRef } from 'react';
import { MealEntry, FoodItem } from '../types';
import { mealService, foodService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface EnhancedAddMealViewProps {
  currentUserId: string | null;
  onMealAdded?: (meal: MealEntry) => void;
}

const EnhancedAddMealView: React.FC<EnhancedAddMealViewProps> = ({ 
  currentUserId, 
  onMealAdded 
}) => {
  const [mealData, setMealData] = useState({
    mealname: '',
    portionsize: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Search food items
  const handleFoodSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await foodService.searchFoodItems(query);
      setSearchResults(results);
    } catch (err: any) {
      console.error('Error searching food items:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select food item from search
  const handleFoodItemSelect = (foodItem: FoodItem) => {
    setMealData({
      mealname: foodItem.name,
      portionsize: '100g',
      calories: foodItem.calories_per_100g,
      protein: foodItem.protein_per_100g,
      carbs: foodItem.carbs_per_100g,
      fat: foodItem.fat_per_100g
    });
    setShowFoodSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Calculate nutrition based on portion size
  const calculateNutrition = (baseValue: number, portionGrams: number) => {
    return Math.round((baseValue * portionGrams) / 100);
  };

  // Handle portion size change
  const handlePortionChange = (newPortion: string) => {
    setMealData(prev => ({ ...prev, portionsize: newPortion }));
    
    // If we have a selected food item, recalculate nutrition
    const selectedFood = searchResults.find(item => item.name === mealData.mealname);
    if (selectedFood) {
      const portionGrams = parseInt(newPortion.replace(/\D/g, '')) || 100;
      setMealData(prev => ({
        ...prev,
        portionsize: newPortion,
        calories: calculateNutrition(selectedFood.calories_per_100g, portionGrams),
        protein: calculateNutrition(selectedFood.protein_per_100g, portionGrams),
        carbs: calculateNutrition(selectedFood.carbs_per_100g, portionGrams),
        fat: calculateNutrition(selectedFood.fat_per_100g, portionGrams)
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId) {
      setError('Please log in to add meals');
      return;
    }

    if (!mealData.mealname || mealData.calories <= 0) {
      setError('Please provide meal name and valid nutrition data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload image if selected (simplified - store as data URL for now)
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = imagePreview; // In production, upload to storage
      }

      const newMeal: Omit<MealEntry, 'id' | 'created_at'> = {
        user_id: currentUserId,
        mealname: mealData.mealname,
        portionsize: mealData.portionsize,
        imageurl: imageUrl,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        date: new Date().toISOString().split('T')[0]
      };

      const savedMeal = await mealService.createMeal(newMeal, currentUserId);
      
      if (onMealAdded) {
        onMealAdded(savedMeal);
      }

      // Reset form
      setMealData({
        mealname: '',
        portionsize: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      });
      setSelectedImage(null);
      setImagePreview('');
      
      alert('Meal added successfully!');
    } catch (err: any) {
      console.error('Error adding meal:', err);
      setError(err.message || 'Failed to add meal');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to add meals to your diary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add Meal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Log your meals and track your nutrition
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Food Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Find Food Item
          </h3>
          
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowFoodSearch(!showFoodSearch)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {showFoodSearch ? 'Hide Food Search' : 'Search Food Database'}
            </button>

            {showFoodSearch && (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleFoodSearch(e.target.value);
                    }}
                    placeholder="Search for food items..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <LoadingSpinner />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleFoodItemSelect(item)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.calories_per_100g} cal, {item.protein_per_100g}g protein per 100g
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Meal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meal Name *
              </label>
              <input
                type="text"
                value={mealData.mealname}
                onChange={(e) => setMealData(prev => ({ ...prev, mealname: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Grilled Chicken Salad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Portion Size
              </label>
              <input
                type="text"
                value={mealData.portionsize}
                onChange={(e) => handlePortionChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 150g, 1 cup, 1 serving"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Calories *
              </label>
              <input
                type="number"
                value={mealData.calories}
                onChange={(e) => setMealData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                value={mealData.protein}
                onChange={(e) => setMealData(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carbs (g)
              </label>
              <input
                type="number"
                value={mealData.carbs}
                onChange={(e) => setMealData(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fat (g)
              </label>
              <input
                type="number"
                value={mealData.fat}
                onChange={(e) => setMealData(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Meal Photo (Optional)
          </h3>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors"
            >
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">
                  Click to upload meal photo
                </div>
              </div>
            </button>

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Meal preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !mealData.mealname || mealData.calories <= 0}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner />
              <span className="ml-2">Adding Meal...</span>
            </div>
          ) : (
            'Add Meal'
          )}
        </button>
      </form>
    </div>
  );
};

export default EnhancedAddMealView;