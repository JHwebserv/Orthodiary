// components/PhotoDetailView.tsx
import React from 'react';
import { OrthoPhoto } from '../types';

interface PhotoDetailViewProps {
  photo: OrthoPhoto;
  photos: OrthoPhoto[];
  onBack: () => void;
  onToggleStar: (photo: OrthoPhoto, event?: React.MouseEvent) => void;
  onDelete: (photo: OrthoPhoto, event?: React.MouseEvent) => void;
  editingMemo: string;
  isEditingMemo: boolean;
  onMemoChange: (memo: string) => void;
  onStartEditMemo: () => void;
  onCancelEditMemo: () => void;
  onSaveMemo: () => void;
  loading: boolean;
}

const PhotoDetailView: React.FC<PhotoDetailViewProps> = ({
  photo,
  photos,
  onBack,
  onToggleStar,
  onDelete,
  editingMemo,
  isEditingMemo,
  onMemoChange,
  onStartEditMemo,
  onCancelEditMemo,
  onSaveMemo,
  loading
}) => {
  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const previousPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onToggleStar(photo)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform ${
                photo.isStarred 
                  ? 'bg-yellow-500 text-white shadow-lg scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              } active:scale-95`}
            >
              <span className={`transition-transform ${photo.isStarred ? 'animate-pulse' : ''}`}>
                ⭐
              </span>
              {photo.isStarred ? '즐겨찾기 해제' : '즐겨찾기'}
            </button>
            <button
              onClick={(e) => onDelete(photo, e)}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              {loading ? '삭제 중...' : '🗑️ 삭제'}
            </button>
            <button
              onClick={() => {
                const shareData = {
                  title: '교정 일기 기록',
                  text: `교정 상태 - ${new Date(photo.timestamp).toLocaleDateString('ko-KR')}`,
                };
                if (navigator.share) {
                  navigator.share(shareData);
                } else {
                  alert('병원에 공유할 수 있는 링크가 클립보드에 복사되었습니다.');
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              병원 공유
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="aspect-square relative">
            <img 
              src={photo.data} 
              alt="교정 사진" 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => {
                const newWindow = window.open();
                if (newWindow) {
                  newWindow.document.write(`
                    <html>
                      <head><title>교정 사진 확대</title></head>
                      <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                        <img src="${photo.data}" style="max-width:100%; max-height:100%; object-fit:contain;" onclick="window.close()">
                      </body>
                    </html>
                  `);
                }
              }}
            />
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full">
              클릭하여 확대
            </div>
            {photo.isStarred && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full">
                ⭐ 즐겨찾기
              </div>
            )}
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {new Date(photo.timestamp).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h2>
                <p className="text-gray-600">
                  {new Date(photo.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">메모</label>
                  {isEditingMemo ? (
                    <div className="flex gap-2">
                      <button
                        onClick={onCancelEditMemo}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        취소
                      </button>
                      <button
                        onClick={onSaveMemo}
                        disabled={loading}
                        className="text-sm text-blue-500 hover:text-blue-700 disabled:text-blue-300"
                      >
                        {loading ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onStartEditMemo}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      편집
                    </button>
                  )}
                </div>
                {isEditingMemo ? (
                  <textarea
                    value={editingMemo}
                    onChange={(e) => onMemoChange(e.target.value)}
                    placeholder="교정 상태나 특이사항을 기록하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[100px] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={onStartEditMemo}
                  >
                    {photo.memo || (
                      <span className="text-gray-400">메모를 추가하려면 클릭하세요...</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {previousPhoto && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔄 이전 사진과 비교
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">이전 기록</p>
                <div className="aspect-square relative">
                  <img 
                    src={previousPhoto.data} 
                    alt="이전 교정 사진" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {new Date(previousPhoto.timestamp).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">현재 기록</p>
                <div className="aspect-square relative">
                  <img 
                    src={photo.data} 
                    alt="현재 교정 사진" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {new Date(photo.timestamp).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📈 치료 경과: {Math.ceil((new Date(photo.timestamp).getTime() - new Date(previousPhoto.timestamp).getTime()) / (1000 * 60 * 60 * 24))}일 경과
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoDetailView;