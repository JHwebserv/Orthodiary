// server/server.js
require('dotenv').config(); // 이 줄을 맨 위에 추가
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3001;

// 환경변수 디버깅 로그
console.log('🔍 환경변수 확인:');
console.log('KAKAO_APP_KEY:', process.env.KAKAO_APP_KEY);
console.log('VITE_KAKAO_APP_KEY:', process.env.VITE_KAKAO_APP_KEY);
console.log('NAVER_CLIENT_ID:', process.env.NAVER_CLIENT_ID);
console.log('VITE_NAVER_CLIENT_ID:', process.env.VITE_NAVER_CLIENT_ID);
console.log('NAVER_CLIENT_SECRET:', process.env.NAVER_CLIENT_SECRET ? '설정됨' : '설정 안됨');

// Firebase Admin 초기화
let firebaseInitialized = false;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin 초기화 완료');
  }
} catch (error) {
  console.log('⚠️ Firebase Admin 초기화 스킵 (테스트 환경):', error.message);
}

// 미들웨어
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '서버가 정상 작동 중입니다.',
    firebase: firebaseInitialized ? '연결됨' : '연결 안됨',
    timestamp: new Date().toISOString()
  });
});

// 카카오 OAuth 처리
// server.js의 카카오 OAuth 처리 부분만 수정

// server.js 수정 - Custom Token 대신 사용자 정보만 반환

// 카카오 OAuth 처리 (수정된 버전)
app.post('/auth/kakao', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '인증 코드가 필요합니다.' });
    }

    console.log('🔄 카카오 토큰 요청 중...');
    
    // 환경변수에서 카카오 앱 키 가져오기
    const kakaoAppKey = process.env.VITE_KAKAO_APP_KEY || process.env.KAKAO_APP_KEY;
    console.log('🔍 사용되는 카카오 앱 키:', kakaoAppKey);
    
    if (!kakaoAppKey || kakaoAppKey === 'your_kakao_app_key') {
      throw new Error('카카오 앱 키가 설정되지 않았습니다.');
    }
    
    // 1. 카카오 액세스 토큰 요청
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: kakaoAppKey,
      redirect_uri: `${req.get('origin') || 'http://localhost:5173'}/auth/kakao/callback`,
      code: code
    });

    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', tokenParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('✅ 카카오 액세스 토큰 획득');

    // 2. 카카오 사용자 정보 요청
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const kakaoUser = userResponse.data;
    console.log('✅ 카카오 사용자 정보 획득:', {
      id: kakaoUser.id,
      nickname: kakaoUser.properties?.nickname,
      email: kakaoUser.kakao_account?.email || '없음'
    });

    // 3. 이메일이 없어도 처리할 수 있도록 수정
    const userEmail = kakaoUser.kakao_account?.email || `kakao_${kakaoUser.id}@ortho-diary.local`;
    const userName = kakaoUser.properties?.nickname || `카카오사용자${kakaoUser.id}`;
    
    // Custom Token 대신 사용자 정보와 성공 플래그만 반환
    res.json({
      success: true,
      // customToken 제거
      user: {
        uid: `kakao_${kakaoUser.id}`,
        id: kakaoUser.id,
        email: userEmail,
        displayName: userName,
        photoURL: kakaoUser.properties?.profile_image || null,
        provider: 'kakao',
        hasEmail: !!kakaoUser.kakao_account?.email
      }
    });

  } catch (error) {
    console.error('❌ 카카오 인증 처리 실패:', error.response?.data || error.message);
    res.status(500).json({ 
      error: '카카오 인증 처리 중 오류가 발생했습니다.',
      details: error.response?.data || error.message
    });
  }
});

// 네이버 OAuth 처리
// server.js의 네이버 OAuth 처리 부분 수정

app.post('/auth/naver', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '인증 코드가 필요합니다.' });
    }

    console.log('🔄 네이버 토큰 요청 중...');
    
    // 환경변수에서 네이버 클라이언트 정보 가져오기
    const naverClientId = process.env.VITE_NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
    
    console.log('🔍 사용되는 네이버 클라이언트 ID:', naverClientId);
    
    if (!naverClientId || !naverClientSecret) {
      throw new Error('네이버 클라이언트 정보가 설정되지 않았습니다.');
    }
    
    // 1. 네이버 액세스 토큰 요청
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: naverClientId,
      client_secret: naverClientSecret,
      redirect_uri: `${req.get('origin') || 'http://localhost:5173'}/auth/naver/callback`,
      code: code,
      state: state || ''
    });

    const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', tokenParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;
    console.log('✅ 네이버 액세스 토큰 획득');

    // 2. 네이버 사용자 정보 요청
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const naverUser = userResponse.data.response;
    console.log('✅ 네이버 사용자 정보 획득:', {
      id: naverUser.id,
      name: naverUser.name,
      email: naverUser.email || '없음'
    });

    // 3. 이메일이 없어도 처리할 수 있도록 수정
    const userEmail = naverUser.email || `naver_${naverUser.id.substring(0, 10)}@ortho-diary.local`;
    const userName = naverUser.name || naverUser.nickname || `네이버사용자${naverUser.id.substring(0, 8)}`;
    
    // Custom Token 대신 사용자 정보와 성공 플래그만 반환
    res.json({
      success: true,
      user: {
        uid: `naver_${naverUser.id}`,
        id: naverUser.id,
        email: userEmail,
        displayName: userName,
        photoURL: naverUser.profile_image || null,
        provider: 'naver',
        hasEmail: !!naverUser.email
      }
    });

  } catch (error) {
    console.error('❌ 네이버 인증 처리 실패:', error.response?.data || error.message);
    res.status(500).json({ 
      error: '네이버 인증 처리 중 오류가 발생했습니다.',
      details: error.response?.data || error.message
    });
  }
});

// Firebase Custom Token 생성 함수
async function createFirebaseCustomToken(userData) {
  try {
    if (firebaseInitialized) {
      const customToken = await admin.auth().createCustomToken(userData.uid, {
        provider: userData.provider,
        email: userData.email,
        name: userData.name,
        profileImage: userData.profileImage
      });
      console.log('✅ Firebase Custom Token 생성 완료');
      return customToken;
    } else {
      // 개발/테스트 환경에서는 더미 토큰 반환
      console.log('⚠️ Firebase Admin 미설정 - 더미 토큰 반환');
      return `dummy_token_${userData.uid}_${Date.now()}`;
    }
  } catch (error) {
    console.error('❌ Firebase Custom Token 생성 실패:', error);
    throw error;
  }
}

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 CORS 허용 주소: http://localhost:5173, http://localhost:3000`);
  console.log(`🔥 Firebase Admin: ${firebaseInitialized ? '연결됨' : '연결 안됨'}`);
  console.log(`⏰ 시작 시간: ${new Date().toLocaleString('ko-KR')}`);
});

module.exports = app;