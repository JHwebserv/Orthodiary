// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '../firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (user: User) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 AuthProvider: 인증 상태 리스너 설정...');
    
    // localStorage에서 카카오/네이버 사용자 복원
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('✅ localStorage 사용자 복원:', parsedUser.displayName);
        setUser(parsedUser);
        setLoading(false);
      } catch (e) {
        console.error('❌ localStorage 파싱 실패:', e);
        localStorage.removeItem('auth_user');
      }
    }

    // Firebase 인증 상태 변경 리스너
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      console.log('🔄 Firebase 인증 상태 변경:', firebaseUser ? '로그인됨' : '로그아웃됨');
      
      // Firebase 사용자가 있으면 설정 (구글 로그인)
      if (firebaseUser) {
        setUser(firebaseUser);
      }
      // localStorage 사용자가 없고 Firebase 사용자도 없으면 null
      else if (!localStorage.getItem('auth_user')) {
        setUser(null);
      }
      
      setLoading(false);
      
      if (error) {
        setError(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = (user: User) => {
    console.log('✅ AuthProvider: 사용자 로그인:', user.displayName || user.email);
    setUser(user);
    setError(null);
    
    // 카카오/네이버 사용자의 경우 localStorage에 저장
    const provider = user.providerData?.[0]?.providerId;
    if (provider === 'kakao' || provider === 'naver') {
      localStorage.setItem('auth_user', JSON.stringify(user));
      console.log('💾 사용자 정보 localStorage에 저장');
    }
  };

  const logout = () => {
    console.log('✅ AuthProvider: 사용자 로그아웃');
    setUser(null);
    setError(null);
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};