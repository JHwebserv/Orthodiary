// src/components/LoadingSpinner.tsx

import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          로딩 중...
        </h2>
        <p className="text-gray-600">
          잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;