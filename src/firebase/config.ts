// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ✅ 실제 Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyC5BGIP-ZF-Mnn6b_QUMjJoR59FQXciI9g",
  authDomain: "orthodiaryweb.firebaseapp.com",
  projectId: "orthodiaryweb",
  storageBucket: "orthodiaryweb.appspot.com",
  messagingSenderId: "904765000770",
  appId: "1:904765000770:web:c0c86432f3eea7886871db"
};

// Firebase 설정 검증 (선택)
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your-api-key-here") {
  console.error("❌ Firebase 설정이 완료되지 않았습니다!");
  console.error("src/firebase/config.ts 파일에서 실제 Firebase 설정값으로 교체해주세요.");
}

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 인스턴스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;