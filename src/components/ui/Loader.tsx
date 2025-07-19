import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Chargement..." }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
};

export default Loader;