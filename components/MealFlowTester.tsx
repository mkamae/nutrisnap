import React, { useState } from 'react';
import { mealService } from '../services/supabaseService';
import { MealEntry } from '../types';

interface MealFlowTesterProps {
  currentUserId: string | null;
  onMealAdded: (meal: MealEntry) => void;
}

const MealFlowTester: React.FC<MealFlowTesterProps> = ({ currentUserId, onMealAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testAddMeal = async () => {
    if (!currentUserId) {
      setResult('❌ No user ID available');
      return;
    }

    setIsLoading(true);
    setResult('🔄 Testing meal addition...');

    try {
      const testMeal = {
        mealName: 'Test Meal ' + new Date().getTime(),
        portionSize: '1 serving',
        imageUrl: 'https://via.placeholder.com/300x200?text=Test+Meal',
        calories: 250,
        protein: 15,
        carbs: 30,
        fat: 8,
        date: new Date().toISOString().split('T')[0], // Today's date
        user_id: currentUserId
      };

      console.log('🧪 Test meal data:', testMeal);

      // Add meal using the service
      const savedMeal = await mealService.addMeal(testMeal, currentUserId);
      console.log('✅ Meal saved:', savedMeal);

      // Call the parent callback to update the state
      onMealAdded(savedMeal);

      setResult(`✅ Success! Meal added with ID: ${savedMeal.id}\nDate: ${savedMeal.date}\nName: ${savedMeal.mealName}`);

    } catch (error) {
      console.error('❌ Test failed:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGetMeals = async () => {
    if (!currentUserId) {
      setResult('❌ No user ID available');
      return;
    }

    setIsLoading(true);
    setResult('🔄 Testing meal retrieval...');

    try {
      const meals = await mealService.getMeals(currentUserId);
      console.log('📊 Retrieved meals:', meals);

      const today = new Date().toISOString().split('T')[0];
      const todaysMeals = meals.filter(meal => {
        const mealDate = meal.date;
        return typeof mealDate === 'string' && 
               (mealDate.includes(today) || mealDate.split('T')[0] === today);
      });

      setResult(`📊 Total meals: ${meals.length}\n📅 Today's meals: ${todaysMeals.length}\n🗓️ Today's date: ${today}\n\nAll meals:\n${meals.map(m => `- ${m.mealName} (${m.date})`).join('\n')}`);

    } catch (error) {
      console.error('❌ Test failed:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-3">
        🧪 Meal Flow Tester
      </h3>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={testAddMeal}
            disabled={isLoading || !currentUserId}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '⏳ Testing...' : '➕ Test Add Meal'}
          </button>
          
          <button
            onClick={testGetMeals}
            disabled={isLoading || !currentUserId}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? '⏳ Testing...' : '📊 Test Get Meals'}
          </button>
        </div>

        {result && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealFlowTester;