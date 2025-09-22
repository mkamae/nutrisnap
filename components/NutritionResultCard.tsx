import React from 'react';
import type { NutritionData } from '../services/nutritionService';

interface Props {
  loading: boolean;
  data: NutritionData | null;
  error?: string | null;
}

const NutritionResultCard: React.FC<Props> = ({ loading, data, error }) => {
  if (loading) {
    return (
      <div className="rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
        <p className="text-gray-600 dark:text-gray-300">Fetching nutrition data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
        <p className="text-gray-700 dark:text-gray-300">No nutritional data found for this barcode.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
      <h3 className="text-xl font-semibold mb-2">{data.productName}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <p className="text-xs text-gray-500">Calories (per 100g)</p>
          <p className="text-lg font-semibold">{data.calories ?? '—'}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs text-gray-500">Protein (g/100g)</p>
          <p className="text-lg font-semibold">{data.protein ?? '—'}</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <p className="text-xs text-gray-500">Carbs (g/100g)</p>
          <p className="text-lg font-semibold">{data.carbs ?? '—'}</p>
        </div>
        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
          <p className="text-xs text-gray-500">Fat (g/100g)</p>
          <p className="text-lg font-semibold">{data.fat ?? '—'}</p>
        </div>
      </div>
    </div>
  );
};

export default NutritionResultCard;


