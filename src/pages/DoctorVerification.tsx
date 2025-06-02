// src/pages/DoctorVerification.tsx

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const DoctorVerification: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    licenseNumber: '',
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    specialization: [] as string[],
    experience: 0,
    additionalInfo: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value
    }));
  };

  const handleSpecializationChange = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      // 1. 사용자 프로필에 임시 의사 정보 추가 (미승인 상태)
      const doctorInfo = {
        licenseNumber: formData.licenseNumber,
        hospitalName: formData.hospitalName,
        hospitalAddress: formData.hospitalAddress,
        hospitalPhone: formData.hospitalPhone,
        specialization: formData.specialization,
        experience: formData.experience,
        isVerified: false, // 관리자 승인 대기
        verificationStatus: 'pending' as const, // 승인 상태
        submittedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', user.uid), {
        userType: 'doctor',
        doctorInfo,
        updatedAt: new Date(),
      });

      // 2. 별도의 인증 요청 컬렉션에 저장 (관리자 검토용)
      await addDoc(collection(db, 'verificationRequests'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        ...doctorInfo,
        additionalInfo: formData.additionalInfo,
        status: 'pending',
        submittedAt: new Date(),
      });

      alert('병원 인증 신청이 완료되었습니다. 관리자 검토 후 승인 결과를 알려드리겠습니다.');
      navigate('/');
      
    } catch (error) {
      console.error('병원 인증 신청 오류:', error);
      alert('인증 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">병원 인증 신청</h2>
          <p className="mt-2 text-gray-600">
            치과 의사 자격을 인증받아 환자 관리 기능을 이용하세요
          </p>
        </div>

        {/* 안내 사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">인증 절차 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 모든 정보는 정확히 입력해주시기 바랍니다.</li>
            <li>• 관리자 검토 후 1-3일 내에 승인 결과를 알려드립니다.</li>
            <li>• 허위 정보 제공 시 계정이 제재될 수 있습니다.</li>
            <li>• 승인 후 환자 관리, 예약 관리 등의 기능을 이용할 수 있습니다.</li>
          </ul>
        </div>

        {/* 인증 신청 폼 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 의사 면허번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                의사 면허번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                placeholder="예: 제12345호"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 병원명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                병원명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleInputChange}
                placeholder="예: 스마일 치과의원"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 병원 주소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                병원 주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hospitalAddress"
                value={formData.hospitalAddress}
                onChange={handleInputChange}
                placeholder="예: 서울시 강남구 테헤란로 123"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 병원 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                병원 전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="hospitalPhone"
                value={formData.hospitalPhone}
                onChange={handleInputChange}
                placeholder="02-1234-5678"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 전문 분야 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                전문 분야 (복수 선택 가능) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['교정치과', '소아치과', '구강외과', '치주과', '보존과', '보철과', '구강내과', '영상치과', '예방치과'].map((spec) => (
                  <label key={spec} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specialization.includes(spec)}
                      onChange={() => handleSpecializationChange(spec)}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 경력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                임상 경력 (년) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                max="50"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 추가 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추가 정보 (선택사항)
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={4}
                placeholder="학력, 연수 경력, 학회 활동, 논문 발표 등 추가로 알려주고 싶은 정보가 있으시면 작성해주세요."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* 개인정보 동의 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">개인정보 수집 및 이용 동의</h4>
              <p className="text-sm text-gray-600 mb-3">
                입력하신 정보는 병원 인증 검토 목적으로만 사용되며, 인증 완료 후 서비스 제공을 위해 필요한 최소한의 정보만 보관됩니다.
              </p>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  required
                  className="mr-2 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  개인정보 수집 및 이용에 동의합니다. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            {/* 제출 버튼 */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || formData.specialization.length === 0}
                className="flex-1 py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    신청 중...
                  </div>
                ) : (
                  '인증 신청하기'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 문의 안내 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            인증 관련 문의사항이 있으시면{' '}
            <a href="mailto:support@orthodiary.com" className="text-green-600 hover:text-green-800 font-medium">
              support@orthodiary.com
            </a>
            으로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorVerification;