// components/DateDetailView.tsx
import React from 'react';
import { OrthoPhoto } from '../types';

interface DateDetailViewProps {
  date: string;
  photos: OrthoPhoto[];
  onBack: () => void;
  onPhotoSelect: (photo: OrthoPhoto) => void;
  onToggleStar: (photo: OrthoPhoto, event?: React.MouseEvent) => void;
  onDelete: (photo: OrthoPhoto, event?: React.MouseEvent) => void;
  onStartCamera: () => void;
}

const DateDetailView: React.FC<DateDetailViewProps> = ({
  date,
  photos,
  onBack,
  onPhotoSelect,
  onToggleStar,
  onDelete,
  onStartCamera
}) => {
  const dateObj = new Date(date);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {dateObj.toLocaleDateString('ko-KR', { 
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </h1>
            <p className="text-gray-600">{photos.length}개의 기록</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1"
              onClick={() => onPhotoSelect(photo)}
            >
              <div className="aspect-square relative">
                <img 
                  src={photo.data} 
                  alt="교정 사진" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
                <button
                  onClick={(e) => onToggleStar(photo, e)}
                  className={`absolute top-2 right-2 p-2 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                    photo.isStarred 
                      ? 'bg-yellow-500 text-white shadow-lg' 
                      : 'bg-black bg-opacity-50 hover:bg-opacity-70 text-white'
                  }`}
                >
                  <span className={`${photo.isStarred ? 'animate-pulse' : ''}`}>
                    {photo.isStarred ? '⭐' : '☆'}
                  </span>
                </button>
                <button
                  onClick={(e) => onDelete(photo, e)}
                  className="absolute bottom-2 left-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 hover:opacity-100 transition-all transform hover:scale-110 active:scale-95"
                  title="사진 삭제"
                >
                  🗑️
                </button>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-800 mb-1">
                  {new Date(photo.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {photo.memo && (
                  <p className="text-sm text-gray-600 line-clamp-2">{photo.memo}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onStartCamera}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all"
        >
          📸 새로운 사진 추가
        </button>
      </div>
    </div>
  );
};

export default DateDetailView;