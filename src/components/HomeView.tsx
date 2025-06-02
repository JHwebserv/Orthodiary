// components/HomeView.tsx
import React from 'react';
import { OrthoPhoto, PhotosByDate } from '../types';

interface HomeViewProps {
  photos: OrthoPhoto[];
  photosByDate: PhotosByDate;
  sortedDates: string[];
  showStarredOnly: boolean;
  onToggleStarredOnly: () => void;
  onStartCamera: () => void;
  onDateSelect: (dateStr: string) => void;
  onToggleStar: (photo: OrthoPhoto, event?: React.MouseEvent) => void;
  onDelete: (photo: OrthoPhoto, event?: React.MouseEvent) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  photos,
  photosByDate,
  sortedDates,
  showStarredOnly,
  onToggleStarredOnly,
  onStartCamera,
  onDateSelect,
  onToggleStar,
  onDelete
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">나의 교정 여정</h1>
          <p className="text-gray-600 mt-2">매일 교정 상태를 기록하고 진행 과정을 확인하세요</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleStarredOnly}
            className={`px-4 py-2 rounded-lg transition-all ${
              showStarredOnly 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showStarredOnly ? '⭐ 전체 보기' : '⭐ 즐겨찾기만'}
          </button>
          <button
            onClick={onStartCamera}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all"
          >
            📸 촬영하기
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            📸
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">첫 번째 교정 기록을 시작해보세요</h3>
          <p className="text-gray-600 mb-6">교정 상태를 사진으로 기록하여 진행 과정을 추적할 수 있습니다</p>
          <button
            onClick={onStartCamera}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all"
          >
            📸 첫 사진 촬영하기
          </button>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            ⭐
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">즐겨찾기한 사진이 없습니다</h3>
          <p className="text-gray-600 mb-6">중요한 사진에 별표를 눌러 즐겨찾기에 추가해보세요</p>
          <button
            onClick={onToggleStarredOnly}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all"
          >
            전체 사진 보기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {showStarredOnly ? '⭐ 즐겨찾기 사진' : '📅 기록된 날짜별 사진'}
            </h2>
            <span className="text-sm text-gray-500">
              총 {sortedDates.reduce((acc, date) => acc + photosByDate[date].length, 0)}장
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedDates.map((dateStr) => {
              const datePhotos = photosByDate[dateStr];
              const latestPhoto = datePhotos[datePhotos.length - 1];
              const date = new Date(dateStr);
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              const day = date.getDate();
              const formattedDate = `${year}-${month}-${day}`;
              
              return (
                <div
                  key={dateStr}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1"
                  onClick={() => onDateSelect(dateStr)}
                >
                  <div className="aspect-square relative">
                    <img 
                      src={latestPhoto.data} 
                      alt="교정 사진" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {formattedDate}
                    </div>
                    <button
                      onClick={(e) => onToggleStar(latestPhoto, e)}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                        latestPhoto.isStarred 
                          ? 'bg-yellow-500 text-white shadow-lg' 
                          : 'bg-black bg-opacity-50 hover:bg-opacity-70 text-white'
                      }`}
                    >
                      <span className={`${latestPhoto.isStarred ? 'animate-pulse' : ''}`}>
                        {latestPhoto.isStarred ? '⭐' : '☆'}
                      </span>
                    </button>
                    <button
                      onClick={(e) => onDelete(latestPhoto, e)}
                      className="absolute bottom-2 left-2 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs opacity-0 hover:opacity-100 transition-all transform hover:scale-110 active:scale-95"
                      title="사진 삭제"
                    >
                      🗑️
                    </button>
                    {datePhotos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        +{datePhotos.length - 1}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;