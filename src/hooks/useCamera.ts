// hooks/useCamera.ts
import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  const checkVideoReady = useCallback(() => {
    if (videoRef.current && !isVideoReady) {
      const video = videoRef.current;
      const hasValidSize = video.videoWidth > 0 && video.videoHeight > 0;
      const hasMetadata = video.readyState >= 1; // HAVE_METADATA
      const hasStream = !!video.srcObject;
      
      console.log('📐 비디오 상태 체크:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        hasValidSize,
        hasMetadata,
        hasStream
      });

      // 더 관대한 조건으로 준비 완료 판단
      if (hasValidSize) {
        setIsVideoReady(true);
        console.log('✅ 비디오 준비 완료! (크기 기준)');
      } else if (hasMetadata && hasStream) {
        // 메타데이터가 있고 스트림이 있으면 준비 완료로 처리
        console.log('✅ 비디오 준비 완료! (메타데이터 기준)');
        setIsVideoReady(true);
      } else if (hasStream && video.readyState >= 2) {
        // 스트림이 있고 어느 정도 데이터가 로드되었으면 준비 완료
        console.log('✅ 비디오 준비 완료! (데이터 기준)');
        setIsVideoReady(true);
      }
    }
  }, [isVideoReady]);

  const startCamera = useCallback(async () => {
    console.log('📷 카메라 시작 시도...');
    setCameraError(null);
    setIsVideoReady(false);

    try {
      // 기존 스트림 정리
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // 더 간단한 제약 조건으로 시작
      const constraints = [
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
          console.log('✅ 카메라 스트림 성공!');
          break;
        } catch (err) {
          console.warn('⚠️ 제약 조건 실패:', err);
          lastError = err as Error;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('카메라 접근 실패');
      }

      setStream(mediaStream);

      // 비디오 엘리먼트 설정 - 더 직접적인 방식
      if (videoRef.current) {
        const video = videoRef.current;
        
        console.log('🎬 비디오 설정 시작...');
        
        // 기본 설정
        video.muted = true;
        video.playsInline = true;
        video.autoplay = false; // 자동재생 끄기
        
        // 스트림 연결
        video.srcObject = mediaStream;
        
        // 이벤트 리스너 추가 (한 번만)
        const handleLoadedMetadata = () => {
          console.log('🎥 메타데이터 로드됨');
          checkVideoReady();
        };
        
        const handleCanPlay = () => {
          console.log('🎥 재생 가능');
          checkVideoReady();
        };
        
        const handleLoadedData = () => {
          console.log('🎥 데이터 로드됨');
          checkVideoReady();
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('loadeddata', handleLoadedData, { once: true });
        
        // 재생 시도 (사용자 상호작용 없이는 실패할 수 있음)
        try {
          await video.play();
          console.log('▶️ 자동 재생 성공');
        } catch (playError) {
          console.log('⚠️ 자동 재생 실패 (정상적인 브라우저 정책)');
          // 자동재생 실패는 정상적인 상황
        }
        
        // 강제 체크 (2초 후)
        setTimeout(() => {
          console.log('⏰ 강제 준비 상태 체크');
          if (!isVideoReady) {
            console.log('🔧 준비 상태가 아니므로 강제 설정');
            setIsVideoReady(true);
          }
        }, 2000);
      }

    } catch (error) {
      console.error('❌ 카메라 오류:', error);
      handleCameraError(error as Error);
    }
  }, [stream, checkVideoReady, isVideoReady]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoReady(false);
    setCameraError(null);
  }, [stream]);

  const playVideo = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        console.log('✅ 수동 재생 성공');
        return true;
      } catch (error) {
        console.error('❌ 수동 재생 실패:', error);
        return false;
      }
    }
    return false;
  }, []);

  const capturePhoto = useCallback(async (): Promise<string | null> => {
    console.log('📸 사진 촬영 시작');
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ 필수 요소 없음');
      throw new Error('카메라가 준비되지 않았습니다.');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 오류가 발생했습니다.');
    }

    // 비디오가 일시정지되어 있으면 재생 시도
    if (video.paused) {
      try {
        await video.play();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (playError) {
        console.warn('⚠️ 재생 실패, 현재 상태로 진행');
      }
    }

    // Canvas 크기 설정
    let width = video.videoWidth || video.offsetWidth || 640;
    let height = video.videoHeight || video.offsetHeight || 480;
    
    console.log('📐 캡처 크기:', width, 'x', height);
    
    canvas.width = width;
    canvas.height = height;

    // 비디오 프레임 캡처
    try {
      context.drawImage(video, 0, 0, width, height);
    } catch (drawError) {
      throw new Error('비디오 프레임을 캡처할 수 없습니다.');
    }
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    if (imageData.length < 1000 || imageData === 'data:,') {
      throw new Error('유효하지 않은 이미지가 생성되었습니다.');
    }

    return imageData;
  }, []);

  // 이벤트 핸들러들 (useCallback으로 최적화)
  const handleVideoLoadedMetadata = useCallback(() => {
    console.log('🎥 메타데이터 로드 이벤트');
    checkVideoReady();
  }, [checkVideoReady]);

  const handleVideoCanPlay = useCallback(() => {
    console.log('🎥 재생 가능 이벤트');
    checkVideoReady();
  }, [checkVideoReady]);

  const handleVideoPlay = useCallback(() => {
    console.log('▶️ 재생 시작 이벤트');
    checkVideoReady();
  }, [checkVideoReady]);

  const handleVideoError = useCallback((event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = event.currentTarget;
    const error = video.error;
    console.error('❌ 비디오 오류:', error);
    setCameraError('비디오 재생 중 오류가 발생했습니다.');
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
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
  };
};