// src/App.tsx (관리자 페이지 추가)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
import LoginPage from './pages/LoginPage';
import KakaoCallback from './pages/KakaoCallback';
import NaverCallback from './pages/NaverCallback';
import HomePage from './pages/HomePage';
import DoctorVerification from './pages/DoctorVerification';
import AdminPage from './pages/AdminPage';

// 인라인 LoadingSpinner 컴포넌트
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "로딩 중..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {message}
      </h2>
      <p className="text-gray-600">
        잠시만 기다려주세요.
      </p>
    </div>
  </div>
);

// Protected Route 컴포넌트
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading, createDefaultProfile } = useUserProfile(user);

  console.log('ProtectedRoute - user:', user, 'userProfile:', userProfile, 'authLoading:', authLoading, 'profileLoading:', profileLoading);

  if (authLoading) {
    return <LoadingSpinner message="인증 확인 중..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profileLoading) {
    return <LoadingSpinner message="프로필 로딩 중..." />;
  }

  // 프로필이 없으면 기본 환자 프로필 생성
  if (!userProfile) {
    console.log('기본 프로필 생성 중...');
    createDefaultProfile();
    return <LoadingSpinner message="프로필 생성 중..." />;
  }

  return <>{children}</>;
};

// Public Route 컴포넌트 (로그인된 사용자는 홈으로)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('PublicRoute - user:', user, 'loading:', loading);
  
  if (loading) {
    return <LoadingSpinner message="인증 확인 중..." />;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// 메인 앱 라우터
const AppRouter: React.FC = () => {
  console.log('AppRouter 렌더링');
  
  return (
    <Router>
      <Routes>
        {/* 홈페이지 (환자용) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* 관리자 페이지 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* 병원 인증 신청 페이지 */}
        <Route
          path="/doctor-verification"
          element={
            <ProtectedRoute>
              <DoctorVerification />
            </ProtectedRoute>
          }
        />

        {/* 로그인 페이지 */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* 소셜 로그인 콜백 */}
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        <Route path="/auth/naver/callback" element={<NaverCallback />} />

        {/* 404 페이지 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// 메인 App 컴포넌트
const App: React.FC = () => {
  console.log('App 컴포넌트 렌더링');
  
  return (
    <AuthProvider>
      <div className="App">
        <AppRouter />
      </div>
    </AuthProvider>
  );
};

export default App;