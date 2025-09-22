import React from 'react';
import BarcodeScanner from './BarcodeScanner';
import NutritionResultCard from './NutritionResultCard';
import { fetchNutritionByBarcode } from '../services/nutritionService';

const ScanNutritionView: React.FC = () => {
  const [barcode, setBarcode] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);

  const handleDetected = async (code: string) => {
    if (!code || code === barcode) return;
    setBarcode(code);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchNutritionByBarcode(code);
      setData(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch nutrition data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Scan a Barcode</h1>
          <p className="text-gray-600 dark:text-gray-400">Point your camera at a product barcode to fetch nutrition info.</p>
        </div>

        <BarcodeScanner onDetected={handleDetected} />

        {barcode && (
          <p className="text-sm text-gray-500 text-center">Detected: {barcode}</p>
        )}

        <NutritionResultCard loading={loading} data={data} error={error} />
      </div>
    </div>
  );
};

export default ScanNutritionView;


