import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface OrthoPhoto {
  id: string;
  data: string;
  timestamp: string;
  memo: string;
  isStarred?: boolean;
  userId: string;
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile(user);
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState<'home' | 'dateDetail' | 'camera' | 'detail'>('home');
  const [selectedPhoto, setSelectedPhoto] = useState<OrthoPhoto | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [photos, setPhotos] = useState<OrthoPhoto[]>([]);
  const [memo, setMemo] = useState('');
  const [editingMemo, setEditingMemo] = useState('');
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // 카메라 관련 state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    console.log('🔄 Firebase 연결 시도 중...');
    console.log('사용자 ID:', user.uid);

    // Firebase 쿼리 - deleted 필드 조건을 더 유연하게 처리
    const photosQuery = query(
      collection(db, 'orthoPhotos'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(photosQuery, (snapshot) => {
      console.log('📦 Firebase에서 데이터 수신:', snapshot.size, '개 문서');
      
      const loadedPhotos: OrthoPhoto[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 문서 ID:', doc.id, '데이터:', data);
        
        // deleted가 true가 아닌 사진만 포함 (deleted 필드가 없는 경우도 포함)
        if (!data.deleted) {
          loadedPhotos.push({
            id: doc.id,
            ...data
          } as OrthoPhoto);
        }
      });
      
      setPhotos(loadedPhotos);
      console.log('✅ 사진 로드 완료:', loadedPhotos.length, '장 (서버에서 정렬됨)');
    }, (error) => {
      console.error('❌ Firebase 연결 오류:', error);
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);
      alert(`Firebase 연결 오류: ${error.message}`);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      if (window.Kakao && window.Kakao.Auth) {
        try {
          window.Kakao.Auth.logout();
        } catch (e) {
          console.log('카카오 로그아웃 실패:', e);
        }
      }
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 개선된 카메라 시작 함수
  const startCamera = useCallback(async () => {
    console.log('📷 카메라 시작 시도...');
    setCameraError(null);
    setIsVideoReady(false);

    try {
      // 기존 스트림이 있다면 정리
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // 다양한 해상도로 시도
      const constraints = [
        {
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        {
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        {
          video: { facingMode: 'user' }
        },
        {
          video: true
        }
      ];

      let mediaStream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraint of constraints) {
        try {
          console.log('🔍 카메라 제약 조건 시도:', constraint);
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('✅ 카메라 스트림 성공:', constraint);
          break;
        } catch (err) {
          console.warn('⚠️ 제약 조건 실패:', constraint, err);
          lastError = err as Error;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('카메라 접근 실패');
      }

      console.log('📹 스트림 정보:', {
        active: mediaStream.active,
        tracks: mediaStream.getVideoTracks().map(track => ({
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          settings: track.getSettings()
        }))
      });

      setStream(mediaStream);
      setCurrentView('camera');

      // 비디오 엘리먼트 설정을 약간 지연
      setTimeout(async () => {
        if (videoRef.current && mediaStream) {
          console.log('🎬 비디오 엘리먼트 설정 시작...');
          
          const video = videoRef.current;
          
          // 스트림 설정 전 비디오 상태 초기화
          video.srcObject = null;
          
          // 짧은 대기 후 스트림 설정
          setTimeout(async () => {
            video.srcObject = mediaStream;
            video.muted = true;
            video.playsInline = true;
            video.autoplay = true;
            
            console.log('🎭 비디오 속성 설정 완료');
            
            try {
              await video.play();
              console.log('▶️ 비디오 재생 시작');
              
              // 재생 후 상태 확인
              setTimeout(() => {
                console.log('🔍 재생 후 비디오 상태:', {
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  readyState: video.readyState,
                  paused: video.paused,
                  currentTime: video.currentTime
                });
              }, 500);
              
            } catch (playError) {
              console.error('비디오 재생 실패:', playError);
              // 수동 재생 시도
              console.log('🔄 수동 재생 모드로 전환');
            }
          }, 100);
        }
      }, 200);

      // 비디오 준비 완료 확인을 위한 다단계 타이머
      const checkVideoReadyWithRetry = (attempt: number = 1) => {
        setTimeout(() => {
          if (videoRef.current && !isVideoReady && attempt <= 10) {
            const video = videoRef.current;
            console.log(`🔄 비디오 상태 확인 시도 ${attempt}:`, {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
              paused: video.paused,
              currentTime: video.currentTime,
              hasStream: !!video.srcObject
            });
            
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              setIsVideoReady(true);
              console.log('✅ 비디오 준비 완료!');
            } else {
              // 다음 시도
              checkVideoReadyWithRetry(attempt + 1);
            }
          } else if (attempt > 10 && !isVideoReady) {
            console.warn('⚠️ 비디오 준비 시간 초과, 강제 준비 완료 처리');
            setIsVideoReady(true);
          }
        }, attempt * 500); // 점진적으로 간격 증가
      };

      checkVideoReadyWithRetry();

    } catch (error) {
      console.error('❌ 카메라 오류:', error);
      handleCameraError(error as Error);
    }
  }, [stream]);

  // 카메라 오류 처리
  const handleCameraError = (error: Error) => {
    let errorMessage = '카메라에 접근할 수 없습니다.';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '카메라가 다른 애플리케이션에서 사용 중입니다.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = '요청한 카메라 설정을 지원하지 않습니다.';
    }
    
    setCameraError(errorMessage);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoReady(false);
    setCameraError(null);
  };

  // 비디오 이벤트 핸들러들
  const handleVideoLoadedMetadata = () => {
    console.log('🎥 비디오 메타데이터 로드됨');
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('📊 메타데이터 로드 시 상태:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        duration: video.duration
      });
    }
    checkVideoReady();
  };

  const handleVideoCanPlay = () => {
    console.log('🎥 비디오 재생 가능');
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('📊 재생 가능 시 상태:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });
    }
    checkVideoReady();
  };

  const handleVideoPlay = () => {
    console.log('▶️ 비디오 재생 시작됨');
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('📊 재생 시작 시 상태:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        currentTime: video.currentTime
      });
    }
    checkVideoReady();
  };

  const checkVideoReady = () => {
    if (videoRef.current && !isVideoReady) {
      const video = videoRef.current;
      console.log('📐 비디오 크기 확인:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime
      });

      // 더 관대한 조건으로 준비 완료 판단
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setIsVideoReady(true);
        console.log('✅ 비디오 준비 완료!');
      } else if (video.readyState >= 3 && video.currentTime > 0) {
        // 비디오가 재생 중이고 데이터가 있으면 준비 완료로 처리
        console.log('✅ 비디오 재생 중으로 준비 완료 처리');
        setIsVideoReady(true);
      }
    }
  };

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = event.currentTarget;
    const error = video.error;
    console.error('❌ 비디오 오류:', error);
    
    if (error) {
      console.error('비디오 오류 상세:', {
        code: error.code,
        message: error.message
      });
    }
  };

  // 개선된 사진 촬영 함수
  const capturePhoto = async () => {
    console.log('📸 사진 촬영 시작');
    
    if (!videoRef.current || !canvasRef.current || !user?.uid) {
      console.error('❌ 필수 요소 없음');
      alert('카메라가 준비되지 않았습니다.');
      return;
    }

    setLoading(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('❌ Canvas context 없음');
        alert('Canvas 오류가 발생했습니다.');
        return;
      }

      // 비디오 상태 재확인
      console.log('🎥 촬영 시 비디오 상태:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        hasStream: !!video.srcObject
      });

      // 비디오가 재생되지 않는 경우 재생 시도
      if (video.paused || video.ended) {
        console.log('⏸️ 비디오가 일시정지됨, 재생 시도');
        try {
          await video.play();
          // 재생 후 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (playError) {
          console.warn('⚠️ 비디오 재생 실패, 현재 상태로 진행');
        }
      }

      // Canvas 크기 설정 - 비디오 크기가 0인 경우 대체 크기 사용
      let canvasWidth = video.videoWidth;
      let canvasHeight = video.videoHeight;

      if (canvasWidth === 0 || canvasHeight === 0) {
        // 스트림이 활성화되어 있고 비디오 엘리먼트의 렌더링 크기 사용
        if (stream && stream.active && video.offsetWidth > 0 && video.offsetHeight > 0) {
          canvasWidth = video.offsetWidth;
          canvasHeight = video.offsetHeight;
          console.log('📐 렌더링 크기 사용:', canvasWidth, 'x', canvasHeight);
        } else {
          // 기본 크기 사용
          canvasWidth = 640;
          canvasHeight = 640;
          console.log('📐 기본 크기 사용:', canvasWidth, 'x', canvasHeight);
        }
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // 비디오 프레임을 canvas에 그리기
      try {
        context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        console.log('🖼️ Canvas에 비디오 프레임 그리기 완료');
      } catch (drawError) {
        console.error('❌ 비디오 그리기 실패:', drawError);
        alert('비디오 프레임을 캡처할 수 없습니다. 카메라를 다시 시작해주세요.');
        return;
      }
      
      // 이미지 데이터 생성
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      console.log('🖼️ 이미지 데이터 생성:', {
        size: imageData.length,
        preview: imageData.substring(0, 50) + '...',
        isValid: imageData.length > 1000 && imageData !== 'data:,'
      });

      // 유효한 이미지인지 확인
      if (imageData.length < 1000 || imageData === 'data:,') {
        console.error('❌ 무효한 이미지 데이터');
        
        // Canvas 내용 확인
        const imageDataCheck = context.getImageData(0, 0, canvasWidth, canvasHeight);
        const hasData = imageDataCheck.data.some(pixel => pixel !== 0);
        console.log('🔍 Canvas 데이터 존재 여부:', hasData);
        
        if (!hasData) {
          alert('카메라 화면을 읽을 수 없습니다. 카메라 권한을 확인하고 다시 시도해주세요.');
        } else {
          alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
        }
        return;
      }

      const newPhoto = {
        data: imageData,
        timestamp: new Date().toISOString(),
        memo: memo,
        isStarred: false,
        userId: user.uid
      };

      console.log('💾 Firebase에 저장 시도 중...');
      
      // Firebase에 저장
      const docRef = await addDoc(collection(db, 'orthoPhotos'), newPhoto);
      console.log('✅ Firebase 저장 성공! 문서 ID:', docRef.id);

      setMemo('');
      stopCamera();
      setCurrentView('home');
      alert('사진이 성공적으로 저장되었습니다!');
      
    } catch (error) {
      console.error('❌ 사진 촬영 오류:', error);
      if (error instanceof Error) {
        alert(`사진 저장 실패: ${error.message}`);
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveMemo = async () => {
    if (!selectedPhoto || !user?.uid) return;

    setLoading(true);
    try {
      const photoRef = doc(db, 'orthoPhotos', selectedPhoto.id);
      await updateDoc(photoRef, {
        memo: editingMemo
      });
      
      setIsEditingMemo(false);
      alert('메모가 저장되었습니다!');
    } catch (error) {
      console.error('메모 저장 오류:', error);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (photo: OrthoPhoto, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!user?.uid) return;

    try {
      const photoRef = doc(db, 'orthoPhotos', photo.id);
      await updateDoc(photoRef, {
        isStarred: !photo.isStarred
      });
      
      // 선택된 사진이 업데이트된 경우 상태 동기화
      if (selectedPhoto && selectedPhoto.id === photo.id) {
        setSelectedPhoto({
          ...selectedPhoto,
          isStarred: !photo.isStarred
        });
      }
    } catch (error) {
      console.error('별표 토글 오류:', error);
    }
  };

  const deletePhoto = async (photo: OrthoPhoto, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!user?.uid) return;

    const confirmDelete = window.confirm(
      `정말로 이 사진을 삭제하시겠습니까?\n\n삭제된 사진은 복구할 수 없습니다.\n\n촬영일: ${new Date(photo.timestamp).toLocaleDateString('ko-KR')}\n메모: ${photo.memo || '(메모 없음)'}`
    );

    if (!confirmDelete) return;

    setLoading(true);
    try {
      // 실제 문서 삭제 (복구 불가능)
      const photoRef = doc(db, 'orthoPhotos', photo.id);
      await updateDoc(photoRef, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      
      // 현재 보고 있는 사진이 삭제된 경우 홈으로 이동
      if (selectedPhoto && selectedPhoto.id === photo.id) {
        setCurrentView('home');
        setSelectedPhoto(null);
      }
      
      alert('사진이 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 오류:', error);
      alert('사진 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const groupPhotosByDate = () => {
    const filteredPhotos = showStarredOnly ? photos.filter(p => p.isStarred) : photos;
    const grouped: { [key: string]: OrthoPhoto[] } = {};
    filteredPhotos.forEach(photo => {
      const date = new Date(photo.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(photo);
    });
    return grouped;
  };

  const photosByDate = groupPhotosByDate();
  const sortedDates = Object.keys(photosByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 개선된 카메라 뷰
  if (currentView === 'camera') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => {
                stopCamera();
                setCurrentView('home');
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
                autoPlay
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
                  </div>
                </div>
              )}
              
              {/* 준비 완료 표시 */}
              {isVideoReady && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  ✅ 준비 완료
                </div>
              )}

              {/* 격자 가이드 */}
              {isVideoReady && (
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
              onClick={capturePhoto}
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
              <p className="text-center text-sm text-gray-500">
                카메라 권한을 허용하고 잠시 기다려주세요
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'detail' && selectedPhoto) {
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    const previousPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => {
                if (selectedDate) {
                  setCurrentView('dateDetail');
                } else {
                  setCurrentView('home');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => toggleStar(selectedPhoto)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform ${
                  selectedPhoto.isStarred 
                    ? 'bg-yellow-500 text-white shadow-lg scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                } active:scale-95`}
              >
                <span className={`transition-transform ${selectedPhoto.isStarred ? 'animate-pulse' : ''}`}>
                  ⭐
                </span>
                {selectedPhoto.isStarred ? '즐겨찾기 해제' : '즐겨찾기'}
              </button>
              <button
                onClick={(e) => deletePhoto(selectedPhoto, e)}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
              >
                {loading ? '삭제 중...' : '🗑️ 삭제'}
              </button>
              <button
                onClick={() => {
                  const shareData = {
                    title: '교정 일기 기록',
                    text: `교정 상태 - ${new Date(selectedPhoto.timestamp).toLocaleDateString('ko-KR')}`,
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
                src={selectedPhoto.data} 
                alt="교정 사진" 
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => {
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head><title>교정 사진 확대</title></head>
                        <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center; min-height:100vh;">
                          <img src="${selectedPhoto.data}" style="max-width:100%; max-height:100%; object-fit:contain;" onclick="window.close()">
                        </body>
                      </html>
                    `);
                  }
                }}
              />
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full">
                클릭하여 확대
              </div>
              {selectedPhoto.isStarred && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full">
                  ⭐ 즐겨찾기
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {new Date(selectedPhoto.timestamp).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(selectedPhoto.timestamp).toLocaleTimeString('ko-KR', {
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
                          onClick={() => {
                            setIsEditingMemo(false);
                            setEditingMemo(selectedPhoto.memo || '');
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          취소
                        </button>
                        <button
                          onClick={saveMemo}
                          disabled={loading}
                          className="text-sm text-blue-500 hover:text-blue-700 disabled:text-blue-300"
                        >
                          {loading ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingMemo(true)}
                        className="text-sm text-blue-500 hover:text-blue-700"
                      >
                        편집
                      </button>
                    )}
                  </div>
                  {isEditingMemo ? (
                    <textarea
                      value={editingMemo}
                      onChange={(e) => setEditingMemo(e.target.value)}
                      placeholder="교정 상태나 특이사항을 기록하세요..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[100px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setIsEditingMemo(true)}
                    >
                      {selectedPhoto.memo || (
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
                      src={selectedPhoto.data} 
                      alt="현재 교정 사진" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {new Date(selectedPhoto.timestamp).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  📈 치료 경과: {Math.ceil((new Date(selectedPhoto.timestamp).getTime() - new Date(previousPhoto.timestamp).getTime()) / (1000 * 60 * 60 * 24))}일 경과
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'dateDetail' && selectedDate) {
    const datePhotos = photosByDate[selectedDate];
    const date = new Date(selectedDate);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => setCurrentView('home')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {date.toLocaleDateString('ko-KR', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h1>
              <p className="text-gray-600">{datePhotos.length}개의 기록</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {datePhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1"
                onClick={() => {
                  setSelectedPhoto(photo);
                  setEditingMemo(photo.memo || '');
                  setCurrentView('detail');
                }}
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
                    onClick={(e) => toggleStar(photo, e)}
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
                    onClick={(e) => deletePhoto(photo, e)}
                    className="absolute top-2 left-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 hover:opacity-100 transition-all transform hover:scale-110 active:scale-95"
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
            onClick={startCamera}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all"
          >
            📸 새로운 사진 추가
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  🦷
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">교정일지</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile?.userType === 'doctor' && userProfile?.doctorInfo?.verificationStatus === 'pending' ? (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium">
                  ⏰ 인증 검토 중
                </div>
              ) : userProfile?.userType === 'doctor' && userProfile?.doctorInfo?.isVerified ? (
                <button
                  onClick={() => alert('의사 페이지는 다음 단계에서 구현예정!')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🏥 의사 페이지로
                </button>
              ) : (
                <button
                  onClick={() => navigate('/doctor-verification')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🏥 병원 인증
                </button>
              )}
              <div className="flex items-center space-x-2">
                {user?.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="프로필"
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.displayName || user?.email || '사용자'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">나의 교정 여정</h1>
            <p className="text-gray-600 mt-2">매일 교정 상태를 기록하고 진행 과정을 확인하세요</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`px-4 py-2 rounded-lg transition-all ${
                showStarredOnly 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showStarredOnly ? '⭐ 전체 보기' : '⭐ 즐겨찾기만'}
            </button>
            <button
              onClick={startCamera}
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
              onClick={startCamera}
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
              onClick={() => setShowStarredOnly(false)}
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
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setCurrentView('dateDetail');
                    }}
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
                        onClick={(e) => toggleStar(latestPhoto, e)}
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
                        onClick={(e) => deletePhoto(latestPhoto, e)}
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
    </div>
  );
};

export default HomePage;