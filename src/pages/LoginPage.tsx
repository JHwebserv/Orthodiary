import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signInWithKakao, signInWithNaver } from '../firebase/auth';
import { loadSDKs, retrySDKLoad, getSDKStatus } from '../utils/sdkLoader';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkStatus, setSdkStatus] = useState({ kakao: false, naver: false });
  const [isSDKLoading, setIsSDKLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // SDK 동적 로드
  useEffect(() => {
    const initializeSDKs = async () => {
      console.log('🔑 카카오 앱 키:', import.meta.env.VITE_KAKAO_APP_KEY);
      console.log('🔑 네이버 클라이언트 ID:', import.meta.env.VITE_NAVER_CLIENT_ID);
      
      setIsSDKLoading(true);
      
      try {
        const result = await loadSDKs();
        setSdkStatus(result);
        
        if (result.kakao && result.naver) {
          console.log('🎉 모든 SDK 준비 완료!');
        } else {
          console.log('⚠️ 일부 SDK 로드 실패:', result);
        }
      } catch (error) {
        console.error('💥 SDK 초기화 실패:', error);
        // 현재 상태라도 확인
        setSdkStatus(getSDKStatus());
      } finally {
        setIsSDKLoading(false);
      }
    };

    initializeSDKs();
    
    // SDK 로드 완료 이벤트 리스너
    const handleSDKLoaded = (event: CustomEvent) => {
      console.log('🎉 SDK 로드 이벤트 수신:', event.detail);
      setSdkStatus(event.detail);
      setIsSDKLoading(false);
    };

    window.addEventListener('sdkLoaded', handleSDKLoaded as EventListener);
    
    return () => {
      window.removeEventListener('sdkLoaded', handleSDKLoaded as EventListener);
    };
  }, []);

  // SDK 재시도 핸들러
  const handleRetrySDK = async () => {
    setRetryCount(prev => prev + 1);
    setIsSDKLoading(true);
    
    try {
      const result = await retrySDKLoad();
      setSdkStatus(result);
    } catch (error) {
      console.error('💥 SDK 재시도 실패:', error);
    } finally {
      setIsSDKLoading(false);
    }
  };

  // 로그인 핸들러들
  const handleLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      let user;
      switch (provider) {
        case 'google':
          user = await signInWithGoogle();
          break;
        case 'kakao':
          user = await signInWithKakao();
          break;
        case 'naver':
          user = await signInWithNaver();
          break;
        default:
          throw new Error('지원하지 않는 로그인 방식입니다.');
      }
      
      if (user) {
        console.log(`✅ ${provider} 로그인 성공:`, user);
        // 성공 시 자동으로 홈페이지로 리다이렉트됨 (useAuth에서 처리)
      }
    } catch (error) {
      console.error(`❌ ${provider} 로그인 실패:`, error);
      alert(`${provider} 로그인에 실패했습니다. 다시 시도해주세요.`);
    } finally {
      setIsLoading(false);
    }
  };

  // 개별 로그인 핸들러들
  const handleGoogleLogin = () => handleLogin('google');
  const handleKakaoLogin = () => handleLogin('kakao');
  const handleNaverLogin = () => handleLogin('naver');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            교정일지에 오신 것을 환영합니다
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Google 로그인 */}
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? '로그인 중...' : 'Google로 로그인'}
              </button>
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">또는</span>
              </div>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="space-y-3">
              {/* 카카오 로그인 */}
              <button
                onClick={handleKakaoLogin}
                disabled={isLoading || isSDKLoading || !sdkStatus.kakao}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black transition-colors ${
                  sdkStatus.kakao && !isSDKLoading
                    ? 'bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-500' 
                    : 'bg-gray-200 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                {isSDKLoading ? '카카오 SDK 로딩 중...' : 
                 sdkStatus.kakao ? '카카오 로그인' : '카카오 SDK 로드 실패'}
              </button>

              {/* 네이버 로그인 */}
              <button
                onClick={handleNaverLogin}
                disabled={isLoading || isSDKLoading || !sdkStatus.naver}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                  sdkStatus.naver && !isSDKLoading
                    ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"/>
                </svg>
                {isSDKLoading ? '네이버 SDK 로딩 중...' : 
                 sdkStatus.naver ? '네이버 로그인' : '네이버 SDK 로드 실패'}
              </button>

              {/* SDK 재시도 버튼 */}
              {!isSDKLoading && (!sdkStatus.kakao || !sdkStatus.naver) && (
                <button
                  onClick={handleRetrySDK}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  🔄 SDK 다시 로드 (시도: {retryCount + 1})
                </button>
              )}
            </div>
          </div>

          <div className="text-xs text-center text-gray-500 space-y-2">
            <p>로그인하면 <a href="#" className="text-indigo-600 hover:text-indigo-500">서비스 약관</a>과 <a href="#" className="text-indigo-600 hover:text-indigo-500">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;