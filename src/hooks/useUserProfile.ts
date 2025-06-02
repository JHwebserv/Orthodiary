// src/hooks/useUserProfile.ts (수정된 버전)

import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../types/user';

export const useUserProfile = (user: any) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createDefaultProfile = async () => {
    if (!user) return;

    try {
      console.log('🔄 기본 환자 프로필 생성 중...');
      
      const defaultProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        userType: 'patient', // 기본적으로 환자로 설정
        isProfileComplete: false,
        patientInfo: {
          treatmentStartDate: new Date().toISOString().split('T')[0],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), defaultProfile);
      setUserProfile(defaultProfile);
      console.log('✅ 기본 환자 프로필 생성 완료');
    } catch (err) {
      console.error('❌ 기본 프로필 생성 오류:', err);
      setError('프로필 생성 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    console.log('👤 사용자 프로필 리스너 설정:', user.uid);

    // 실시간 업데이트를 위한 Firestore listener 사용
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data() as UserProfile;
          setUserProfile(userData);
          console.log('👤 사용자 프로필 업데이트:', userData.userType);
        } else {
          // 사용자 프로필이 없는 경우
          console.log('👤 사용자 프로필이 없음 - 생성 필요');
          setUserProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('사용자 프로필 로드 오류:', err);
        setError('사용자 프로필을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    );

    // cleanup function
    return () => {
      console.log('👤 사용자 프로필 리스너 정리');
      unsubscribe();
    };
  }, [user?.uid]);

  return { userProfile, loading, error, createDefaultProfile };
};