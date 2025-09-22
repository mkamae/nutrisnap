import React from 'react';
import { BarcodeScannerComponent } from 'react-qr-barcode-scanner';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected }) => {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/80">
      <BarcodeScannerComponent
        width={500}
        height={300}
        onUpdate={(err, result) => {
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


