export interface NutritionData {
  productName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Fetch nutrition info from Open Food Facts by barcode (EAN/UPC)
export async function fetchNutritionByBarcode(barcode: string): Promise<NutritionData | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Open Food Facts request failed (${res.status})`);
  }
  const json = await res.json();
  if (json.status !== 1 || !json.product) {
    return null;
  }
  const p = json.product || {};
  const nutr = p.nutriments || {};
  const toNumber = (v: any) => (typeof v === 'number' ? v : v ? Number(v) : undefined);
  return {
    productName: p.product_name || p.brands || 'Unknown product',
    calories: toNumber(nutr['energy-kcal_100g'] ?? nutr['energy-kcal_serving']),
    protein: toNumber(nutr['proteins_100g'] ?? nutr['proteins_serving']),
    carbs: toNumber(nutr['carbohydrates_100g'] ?? nutr['carbohydrates_serving']),
    fat: toNumber(nutr['fat_100g'] ?? nutr['fat_serving'])
  };
}


