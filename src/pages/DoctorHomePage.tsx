// src/pages/DoctorHomePage.tsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

const DoctorHomePage: React.FC = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    console.log('💣 핵폭탄급 로그아웃 시작...');
    
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      if (window.Kakao && window.Kakao.Auth) {
        try {
          window.Kakao.Auth.logout();
        } catch (e) {
          console.log('카카오 로그아웃 실패:', e);
        }
      }
      
      try {
        await signOut(auth);
      } catch (e) {
        console.log('Firebase 로그아웃 실패:', e);
      }
      
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
    } catch (error) {
      console.error('❌ 로그아웃 중 오류:', error);
    }
    
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">교정일지 의사용</h1>
                <p className="text-sm text-gray-500">환자 치료 관리 시스템</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="프로필" 
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  Dr. {user.displayName || user.email || '사용자'}
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

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 웰컴 섹션 */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold mb-2">
            안녕하세요, Dr. {user.displayName || user.email}님!
          </h1>
          <p className="text-green-100">
            오늘은 {today}입니다. 오늘 진료 예정 환자는 3명입니다.
          </p>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 환자 수</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">치료 완료</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">치료 중</p>
                <p className="text-2xl font-bold text-gray-900">9</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">주의 필요</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* 주요 기능 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 환자 관리 카드 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">환자 관리</h3>
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-4">환자 정보 조회 및 치료 계획 관리</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              환자 목록 보기
            </button>
          </div>

          {/* 오늘 예약 카드 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">오늘 예약</h3>
              <div className="bg-green-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 mb-2">오늘 예약된 환자: 3명</p>
            <p className="text-sm text-gray-500 mb-4">다음 예약: 오후 2:00 김영희님</p>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              예약 일정 보기
            </button>
          </div>

          {/* 메시지 카드 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">환자 메시지</h3>
              <div className="bg-yellow-100 p-2 rounded-full relative">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  5
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">새로운 메시지 5개</p>
            <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors">
              메시지 확인하기
            </button>
          </div>
        </div>

        {/* 최근 환자 활동 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 환자 활동</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">김</span>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">김영희 님이 교정일지를 업데이트했습니다</p>
                  <p className="text-sm text-gray-500">2시간 전</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                확인
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">박</span>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">박민수 님이 질문을 남겼습니다</p>
                  <p className="text-sm text-gray-500">4시간 전</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                답변
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              모든 활동 보기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorHomePage;