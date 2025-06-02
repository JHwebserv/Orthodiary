// src/pages/KakaoCallback.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const KakaoCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  
  // 중복 실행 방지를 위한 ref
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 이미 처리되었다면 리턴
    if (hasProcessed.current) {
      console.log('⚠️ 이미 처리된 콜백 - 스킵');
      return;
    }

    const handleKakaoCallback = async () => {
      try {
        // 처리 시작 플래그 설정
        hasProcessed.current = true;
        
        console.log('🔄 카카오 콜백 처리 시작...');
        
        // URL에서 인증 코드 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
          throw new Error(`카카오 로그인 실패: ${errorParam}`);
        }
        
        if (!code) {
          throw new Error('인증 코드가 없습니다.');
        }
        
        console.log('✅ 카카오 인증 코드 받음:', code.substring(0, 10) + '...');
        
        // 백엔드 API에 인증 코드 전송 (단 한 번만)
        console.log('🔄 백엔드 API 호출 중...');
        const response = await fetch('http://localhost:3001/auth/kakao', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '백엔드 API 호출 실패');
        }
        
        const data = await response.json();
        console.log('✅ 백엔드 API 응답:', data);
        
        if (!data.success || !data.user) {
          throw new Error('사용자 정보를 받지 못했습니다.');
        }

        // 사용자 정보로 로그인 처리
        console.log('🔄 로그인 처리 중...');
        
        // AuthContext에 사용자 정보 직접 설정
        const mockUser = {
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL,
          emailVerified: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          },
          providerData: [{
            providerId: 'kakao',
            uid: data.user.id.toString(),
            displayName: data.user.displayName,
            email: data.user.email,
            photoURL: data.user.photoURL
          }]
        } as any;
        
        // AuthContext의 login 함수 호출
        login(mockUser);
        
        setStatus('success');
        
        console.log('🎉 카카오 로그인 처리 완료! 홈으로 이동합니다.');
        
        // URL 히스토리를 정리하고 홈으로 이동
        setTimeout(() => {
          window.history.replaceState({}, '', '/');
          navigate('/', { replace: true });
        }, 1500);
        
      } catch (err) {
        console.error('❌ 카카오 콜백 처리 실패:', err);
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
        setError(errorMessage);
        setStatus('error');
        
        // 에러 시에도 처리 완료로 마크
        hasProcessed.current = true;
        
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleKakaoCallback();
  }, []); // 의존성 배열 비우기

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              카카오 로그인 처리 중...
            </h2>
            <p className="text-gray-600">
              백엔드 API 호출 및 로그인 진행 중입니다.
            </p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              카카오 로그인 성공! 🎉
            </h2>
            <p className="text-gray-600 mb-2">
              안녕하세요, <strong>JH</strong>님!
            </p>
            <p className="text-gray-500">
              홈 페이지로 이동합니다...
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              로그인 실패
            </h2>
            <p className="text-red-600 mb-4">
              {error}
            </p>
            <p className="text-gray-600">
              로그인 페이지로 돌아갑니다...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KakaoCallback;