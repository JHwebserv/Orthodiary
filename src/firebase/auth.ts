    // src/firebase/auth.ts

    import {
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    signInWithCustomToken,
    User
    } from 'firebase/auth';
    import { auth } from './config';

    // 구글 로그인 (개선된 팝업 방식)
    export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        console.log('🔄 Google 로그인 시도...');
        const provider = new GoogleAuthProvider();
        
        // 더 자연스러운 팝업 설정
        provider.setCustomParameters({
        prompt: 'select_account' // 항상 계정 선택 화면 표시
        });
        
        // 팝업 크기와 위치 최적화
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Google 로그인 성공:', result.user);
        return result.user;
    } catch (error: any) {
        console.error('❌ Google 로그인 실패:', error);
        
        // 팝업 차단 등의 경우 사용자에게 안내
        if (error?.code === 'auth/popup-blocked') {
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        } else if (error?.code === 'auth/popup-closed-by-user') {
        console.log('사용자가 팝업을 닫았습니다.');
        return null; // 에러를 던지지 않고 null 반환
        }
        
        throw error;
    }
    };

    // 카카오 로그인
    export const signInWithKakao = async (): Promise<User | null> => {
    try {
        console.log('🔄 카카오 로그인 시도...');
        if (!window.Kakao) {
        throw new Error('카카오 SDK가 로드되지 않았습니다.');
        }

        if (!window.Kakao.isInitialized()) {
        window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY!);
        console.log('✅ 카카오 SDK 초기화 완료');
        }

        console.log('🌐 카카오 OAuth 인증 시작...');
        const redirectUri = window.location.origin + '/auth/kakao/callback';
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_KAKAO_APP_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,profile_image`;
        
        window.location.href = kakaoAuthUrl;
        return null;
    } catch (error) {
        console.error('💥 카카오 로그인 에러:', error);
        throw error;
    }
    };

    // 네이버 로그인
    export const signInWithNaver = async (): Promise<User | null> => {
    try {
        console.log('🔄 네이버 로그인 시도...');
        if (!window.naver) {
        throw new Error('네이버 SDK가 로드되지 않았습니다.');
        }

        console.log('🌐 네이버 OAuth 인증 시작...');
        const redirectUri = window.location.origin + '/auth/naver/callback';
        const state = Math.random().toString(36).substring(2, 15);
        
        sessionStorage.setItem('naver_state', state);
        
        const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${import.meta.env.VITE_NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
        
        window.location.href = naverAuthUrl;
        return null;
    } catch (error) {
        console.error('💥 네이버 로그인 에러:', error);
        throw error;
    }
    };

    // Custom Token으로 Firebase 로그인
    export const signInWithFirebaseCustomToken = async (customToken: string): Promise<User | null> => {
    try {
        console.log('🔄 Firebase Custom Token 로그인 시도...');
        const userCredential = await signInWithCustomToken(auth, customToken);
        console.log('✅ Firebase Custom Token 로그인 성공:', userCredential.user);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Firebase Custom Token 로그인 실패:', error);
        throw error;
    }
    };

    // 로그아웃 함수
    export const signOutUser = async (): Promise<void> => {
    try {
        console.log('🔄 로그아웃 시도...');
        
        // 카카오 로그아웃
        if (window.Kakao && window.Kakao.Auth) {
        try {
            await new Promise<void>((resolve) => {
            window.Kakao.Auth.logout(() => {
                console.log('✅ 카카오 로그아웃 완료');
                resolve();
            });
            });
        } catch (error) {
            console.log('⚠️ 카카오 로그아웃 스킵:', error);
        }
        }
        
        // 저장소 정리
        sessionStorage.removeItem('naver_state');
        localStorage.removeItem('auth_user');
        
        // Firebase 로그아웃
        const currentUser = auth.currentUser;
        if (currentUser) {
        await signOut(auth);
        console.log('✅ Firebase 로그아웃 완료');
        }
        
        console.log('✅ 로그아웃 완료');
        window.location.href = '/login';
        
    } catch (error) {
        console.error('❌ 로그아웃 실패:', error);
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
    }
    };

    // 인증 상태 변경 리스너
    export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
    };

    // 현재 사용자 가져오기
    export const getCurrentUser = () => auth.currentUser;

    // 추가 유틸리티 함수들
    export const isLoggedIn = (): boolean => {
    return !!auth.currentUser || !!localStorage.getItem('auth_user');
    };

    export const getUserInfo = () => {
    const user = auth.currentUser;
    if (!user) {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
        try {
            return JSON.parse(savedUser);
        } catch (e) {
            return null;
        }
        }
        return null;
    }
    
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
        }
    };
    };