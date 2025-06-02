// hooks/usePhotos.ts
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { OrthoPhoto, PhotosByDate } from '../types';

export const usePhotos = (user: User | null) => {
  const [photos, setPhotos] = useState<OrthoPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    console.log('🔄 Firebase 연결 시도 중...');
    console.log('사용자 ID:', user.uid);

    const photosQuery = query(
      collection(db, 'orthoPhotos'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(photosQuery, (snapshot) => {
      console.log('📦 Firebase에서 데이터 수신:', snapshot.size, '개 문서');
      
      const loadedPhotos: OrthoPhoto[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 문서 ID:', doc.id, '데이터:', data);
        
        if (!data.deleted) {
          loadedPhotos.push({
            id: doc.id,
            ...data
          } as OrthoPhoto);
        }
      });
      
      setPhotos(loadedPhotos);
      console.log('✅ 사진 로드 완료:', loadedPhotos.length, '장 (서버에서 정렬됨)');
    }, (error) => {
      console.error('❌ Firebase 연결 오류:', error);
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);
      alert(`Firebase 연결 오류: ${error.message}`);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const savePhoto = async (imageData: string, memo: string, userId: string) => {
    setLoading(true);
    try {
      const newPhoto = {
        data: imageData,
        timestamp: new Date().toISOString(),
        memo: memo,
        isStarred: false,
        userId: userId
      };

      console.log('💾 Firebase에 저장 시도 중...');
      
      const docRef = await addDoc(collection(db, 'orthoPhotos'), newPhoto);
      console.log('✅ Firebase 저장 성공! 문서 ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ 사진 저장 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (photo: OrthoPhoto) => {
    if (!user?.uid) return null;

    try {
      const photoRef = doc(db, 'orthoPhotos', photo.id);
      await updateDoc(photoRef, {
        isStarred: !photo.isStarred
      });
      
      return { ...photo, isStarred: !photo.isStarred };
    } catch (error) {
      console.error('별표 토글 오류:', error);
      throw error;
    }
  };

  const deletePhoto = async (photo: OrthoPhoto) => {
    if (!user?.uid) return false;

    const confirmDelete = window.confirm(
      `정말로 이 사진을 삭제하시겠습니까?\n\n삭제된 사진은 복구할 수 없습니다.\n\n촬영일: ${new Date(photo.timestamp).toLocaleDateString('ko-KR')}\n메모: ${photo.memo || '(메모 없음)'}`
    );

    if (!confirmDelete) return false;

    setLoading(true);
    try {
      const photoRef = doc(db, 'orthoPhotos', photo.id);
      await updateDoc(photoRef, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      
      alert('사진이 삭제되었습니다.');
      return true;
    } catch (error) {
      console.error('사진 삭제 오류:', error);
      alert('사진 삭제에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveMemo = async (photoId: string, memo: string) => {
    if (!user?.uid) return false;

    setLoading(true);
    try {
      const photoRef = doc(db, 'orthoPhotos', photoId);
      await updateDoc(photoRef, {
        memo: memo
      });
      
      alert('메모가 저장되었습니다!');
      return true;
    } catch (error) {
      console.error('메모 저장 오류:', error);
      alert('메모 저장에 실패했습니다.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const groupPhotosByDate = (showStarredOnly: boolean = false): PhotosByDate => {
    const filteredPhotos = showStarredOnly ? photos.filter(p => p.isStarred) : photos;
    const grouped: PhotosByDate = {};
    filteredPhotos.forEach(photo => {
      const date = new Date(photo.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(photo);
    });
    return grouped;
  };

  return {
    photos,
    loading,
    savePhoto,
    toggleStar,
    deletePhoto,
    saveMemo,
    groupPhotosByDate
  };
};