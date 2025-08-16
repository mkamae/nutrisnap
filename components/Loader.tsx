
import React from 'react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Analyzing..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  );
};

export default Loader;
