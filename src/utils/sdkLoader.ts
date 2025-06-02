// src/utils/sdkLoader.ts

interface SDKStatus {
  kakao: boolean;
  naver: boolean;
}

declare global {
  interface Window {
    Kakao: any;
    naver: any;
  }
}

// SDK 로드 상태 확인
export const getSDKStatus = (): SDKStatus => {
  return {
    kakao: !!(window.Kakao && window.Kakao.init),
    naver: !!(window.naver && window.naver.LoginWithNaverId)
  };
};

// 카카오 SDK 로드
const loadKakaoSDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 이미 로드된 경우
    if (window.Kakao && window.Kakao.init) {
      console.log('✅ 카카오 SDK 이미 로드됨');
      resolve(true);
      return;
    }

    // 스크립트 태그가 이미 있는지 확인
    const existingScript = document.querySelector('script[src*="kakao"]');
    if (existingScript) {
      console.log('🔄 카카오 SDK 로드 중...');
      existingScript.addEventListener('load', () => {
        console.log('✅ 카카오 SDK 로드 완료');
        resolve(true);
      });
      existingScript.addEventListener('error', () => {
        console.error('❌ 카카오 SDK 로드 실패');
        resolve(false);
      });
      return;
    }

    // 새로운 스크립트 태그 생성
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      console.log('✅ 카카오 SDK 로드 완료');
      // SDK 초기화 시도
      try {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY);
          console.log('✅ 카카오 SDK 초기화 완료');
        }
        resolve(true);
      } catch (error) {
        console.error('❌ 카카오 SDK 초기화 실패:', error);
        resolve(false);
      }
    };

    script.onerror = () => {
      console.error('❌ 카카오 SDK 로드 실패');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

// 네이버 SDK 로드
const loadNaverSDK = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 이미 로드된 경우
    if (window.naver && window.naver.LoginWithNaverId) {
      console.log('✅ 네이버 SDK 이미 로드됨');
      resolve(true);
      return;
    }

    // 스크립트 태그가 이미 있는지 확인
    const existingScript = document.querySelector('script[src*="naver"]');
    if (existingScript) {
      console.log('🔄 네이버 SDK 로드 중...');
      existingScript.addEventListener('load', () => {
        console.log('✅ 네이버 SDK 로드 완료');
        resolve(true);
      });
      existingScript.addEventListener('error', () => {
        console.error('❌ 네이버 SDK 로드 실패');
        resolve(false);
      });
      return;
    }

    // 새로운 스크립트 태그 생성
    const script = document.createElement('script');
    script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ 네이버 SDK 로드 완료');
      resolve(true);
    };

    script.onerror = () => {
      console.error('❌ 네이버 SDK 로드 실패');
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

// 모든 SDK 로드
export const loadSDKs = async (): Promise<SDKStatus> => {
  console.log('🔄 SDK 로드 시작...');
  
  const [kakaoLoaded, naverLoaded] = await Promise.all([
    loadKakaoSDK(),
    loadNaverSDK()
  ]);

  const status = {
    kakao: kakaoLoaded,
    naver: naverLoaded
  };

  console.log('📊 SDK 로드 결과:', status);

  // 커스텀 이벤트 발생
  window.dispatchEvent(new CustomEvent('sdkLoaded', { detail: status }));

  return status;
};

// SDK 재시도 로드
export const retrySDKLoad = async (): Promise<SDKStatus> => {
  console.log('🔄 SDK 재시도 로드...');
  
  // 기존 스크립트 태그들 제거
  const existingKakaoScript = document.querySelector('script[src*="kakao"]');
  const existingNaverScript = document.querySelector('script[src*="naver"]');
  
  if (existingKakaoScript) {
    existingKakaoScript.remove();
  }
  if (existingNaverScript) {
    existingNaverScript.remove();
  }

  // 다시 로드
  return loadSDKs();
};