import React from 'react';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected }) => {
  const [Scanner, setScanner] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    // Lazy-load the scanner to avoid SSR/Rollup build errors
    import('react-qr-barcode-scanner')
      .then((mod) => setScanner(() => mod.BarcodeScannerComponent))
      .catch((e) => setError(e?.message || 'Failed to load scanner'));
  }, []);

  if (!Scanner) {
    return (
      <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
        Loading camera…
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/80">
      <Scanner
        width={500}
        height={300}
        onUpdate={(err: any, result: any) => {
          if (err) {
            setError(err.message);
            return;
          }
          if (result?.text) {
            onDetected(result.text);
          }
        }}
      />
      {error && (
        <div className="p-2 text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20">{error}</div>
      )}
    </div>
  );
};

export default BarcodeScanner;


