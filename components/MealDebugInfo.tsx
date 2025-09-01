import React from 'react';
import { MealEntry } from '../types';

interface MealDebugInfoProps {
  mealEntries: MealEntry[];
  todaysEntries: MealEntry[];
  currentUserId: string | null;
}

const MealDebugInfo: React.FC<MealDebugInfoProps> = ({ 
  mealEntries, 
  todaysEntries, 
  currentUserId 
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-3">
        🐛 Meal Debug Information
      </h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <strong>Current User ID:</strong> {currentUserId || 'None'}
        </div>
        
        <div>
          <strong>Today's Date:</strong> {today}
        </div>
        
        <div>
          <strong>Total Meal Entries:</strong> {mealEntries.length}
        </div>
        
        <div>
          <strong>Today's Entries:</strong> {todaysEntries.length}
        </div>
        
        {mealEntries.length > 0 && (
          <div>
            <strong>All Meal Entries:</strong>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {mealEntries.map((entry, index) => (
                <div key={entry.id} className="p-2 bg-white dark:bg-gray-800 rounded border">
                  <div><strong>#{index + 1}:</strong> {entry.mealName}</div>
                  <div><strong>Date:</strong> {entry.date} (Type: {typeof entry.date})</div>
                  <div><strong>User ID:</strong> {entry.user_id}</div>
                  <div><strong>Calories:</strong> {entry.calories}</div>
                  <div><strong>Is Today?:</strong> {
                    typeof entry.date === 'string' && 
                    (entry.date.includes(today) || entry.date.split('T')[0] === today) 
                      ? '✅ YES' : '❌ NO'
                  }</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {todaysEntries.length > 0 && (
          <div>
            <strong>Today's Filtered Entries:</strong>
            <div className="mt-2 space-y-2">
              {todaysEntries.map((entry, index) => (
                <div key={entry.id} className="p-2 bg-green-50 dark:bg-green-900/20 rounded border">
                  <div><strong>#{index + 1}:</strong> {entry.mealName}</div>
                  <div><strong>Date:</strong> {entry.date}</div>
                  <div><strong>Calories:</strong> {entry.calories}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <strong>Date Filtering Logic Test:</strong>
          <div className="mt-2">
            {mealEntries.map((entry, index) => {
              const entryDate = entry.date;
              const includesTest = typeof entryDate === 'string' && entryDate.includes(today);
              const splitTest = typeof entryDate === 'string' && entryDate.split('T')[0] === today;
              const finalResult = includesTest || splitTest;
              
              return (
                <div key={entry.id} className="text-xs mb-1">
                  <strong>Entry {index + 1}:</strong> "{entryDate}" → 
                  includes({today}): {includesTest ? '✅' : '❌'}, 
                  split[0] === {today}: {splitTest ? '✅' : '❌'}, 
                  Final: {finalResult ? '✅' : '❌'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealDebugInfo;