// components/CameraView.tsx
import React, { useState, useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';

interface CameraViewProps {
  onCapture: (imageData: string, memo: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel, loading }) => {
  const [memo, setMemo] = useState('');
  const {
    videoRef,
    canvasRef,
    isVideoReady,
    cameraError,
    retryCount,
    startCamera,
    stopCamera,
    playVideo,
    capturePhoto,
    setCameraError,
    setRetryCount,
    handleVideoLoadedMetadata,
    handleVideoCanPlay,
    handleVideoPlay,
    handleVideoError
  } = useCamera();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    try {
      const imageData = await capturePhoto();
      if (imageData) {
        await onCapture(imageData, memo);
        setMemo('');
        stopCamera();
      }
    } catch (error) {
      console.error('사진 촬영 오류:', error);
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handlePlayVideo = async () => {
    const success = await playVideo();
    if (!success) {
      alert('비디오 재생에 실패했습니다. 브라우저에서 미디어 재생을 허용해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← 돌아가기
          </button>
          <h2 className="text-lg font-semibold">교정 상태 촬영</h2>
          <div></div>
        </div>

        {cameraError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{cameraError}</p>
              <button
                onClick={() => {
                  setCameraError(null);
                  setRetryCount(prev => prev + 1);
                  startCamera();
                }}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="relative aspect-square">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={handleVideoLoadedMetadata}
              onCanPlay={handleVideoCanPlay}
              onPlay={handleVideoPlay}
              onError={handleVideoError}
              style={{ backgroundColor: '#000' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* 로딩 상태 */}
            {!isVideoReady && !cameraError && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>카메라 준비 중...</p>
                  {retryCount > 0 && (
                    <p className="text-sm mt-1">재시도 {retryCount}회</p>
                  )}
                  <button
                    onClick={handlePlayVideo}
                    className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                  >
                    수동으로 시작하기
                  </button>
                </div>
              </div>
            )}
            
            {/* 수동 재생 버튼 (비디오가 일시정지된 경우) */}
            {isVideoReady && videoRef.current?.paused && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <button
                  onClick={handlePlayVideo}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105"
                >
                  ▶️ 재생
                </button>
              </div>
            )}
            
            {/* 준비 완료 표시 */}
            {isVideoReady && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                ✅ 준비 완료
              </div>
            )}

            {/* 격자 가이드 */}
            {isVideoReady && !videoRef.current?.paused && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="border border-white border-opacity-30"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="오늘의 교정 상태나 느낌을 기록하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCapture}
            disabled={loading || !isVideoReady || !!cameraError}
            className={`w-full font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-all ${
              !isVideoReady || !!cameraError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : loading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                저장 중...
              </>
            ) : !isVideoReady ? (
              '⏳ 카메라 준비 중...'
            ) : (
              '📸 사진 촬영'
            )}
          </button>

          {!isVideoReady && !cameraError && (
            <div className="text-center text-sm text-gray-500 space-y-1">
              <p>카메라 권한을 허용하고 잠시 기다려주세요</p>
              <p className="text-xs">준비가 안 되면 "수동으로 시작하기" 버튼을 눌러보세요</p>
            </div>
          )}
          
          {videoRef.current?.paused && isVideoReady && (
            <p className="text-center text-sm text-gray-500">
              비디오 재생 버튼을 클릭하여 카메라를 활성화하세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraView;