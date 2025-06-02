// src/components/Loading.tsx
import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const Loading: React.FC<LoadingProps> = ({ 
  message = '로딩 중...', 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-4 text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

export default Loading;