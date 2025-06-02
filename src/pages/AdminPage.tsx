// src/pages/AdminPage.tsx

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';

interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  licenseNumber: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  specialization: string[];
  experience: number;
  additionalInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  // 인증 요청 목록 실시간 로드
  useEffect(() => {
    const q = query(
      collection(db, 'verificationRequests'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestList: VerificationRequest[] = [];
      snapshot.forEach((doc) => {
        requestList.push({
          id: doc.id,
          ...doc.data()
        } as VerificationRequest);
      });
      setRequests(requestList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 승인 처리
  const handleApprove = async (request: VerificationRequest) => {
    try {
      // 1. 사용자 프로필 업데이트 (의사로 승인)
      await updateDoc(doc(db, 'users', request.userId), {
        userType: 'doctor',
        doctorInfo: {
          licenseNumber: request.licenseNumber,
          hospitalName: request.hospitalName,
          hospitalAddress: request.hospitalAddress,
          hospitalPhone: request.hospitalPhone,
          specialization: request.specialization,
          experience: request.experience,
          isVerified: true,
          verificationStatus: 'approved',
          approvedAt: new Date(),
        },
        updatedAt: new Date(),
      });

      // 2. 인증 요청 상태 업데이트
      await updateDoc(doc(db, 'verificationRequests', request.id), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user?.email || 'admin',
      });

      alert(`${request.userName}님의 병원 인증이 승인되었습니다.`);
      setSelectedRequest(null);
    } catch (error) {
      console.error('승인 처리 오류:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  // 거절 처리
  const handleReject = async (request: VerificationRequest, reason: string) => {
    try {
      // 1. 사용자 프로필 업데이트 (환자로 되돌리기)
      await updateDoc(doc(db, 'users', request.userId), {
        userType: 'patient',
        doctorInfo: {
          ...request,
          isVerified: false,
          verificationStatus: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
        updatedAt: new Date(),
      });

      // 2. 인증 요청 상태 업데이트
      await updateDoc(doc(db, 'verificationRequests', request.id), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: user?.email || 'admin',
        rejectionReason: reason,
      });

      alert(`${request.userName}님의 병원 인증이 거절되었습니다.`);
      setSelectedRequest(null);
    } catch (error) {
      console.error('거절 처리 오류:', error);
      alert('거절 처리 중 오류가 발생했습니다.');
    }
  };

  // 삭제 처리
  const handleDelete = async (requestId: string) => {
    if (!confirm('정말로 이 요청을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'verificationRequests', requestId));
      alert('요청이 삭제되었습니다.');
      setSelectedRequest(null);
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const filteredRequests = requests.filter(req => req.status === selectedTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">대기 중</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">승인됨</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">거절됨</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
                <p className="text-sm text-gray-500">병원 인증 관리</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">관리자: {user?.email}</span>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">대기 중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">거절됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    selectedTab === tab
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'pending' ? '대기 중' : tab === 'approved' ? '승인됨' : '거절됨'}
                  <span className="ml-2 bg-gray-200 text-gray-900 px-2 py-1 rounded-full text-xs">
                    {requests.filter(r => r.status === tab).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* 요청 목록 */}
          <div className="p-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-gray-500">
                  {selectedTab === 'pending' ? '대기 중인 요청이 없습니다.' :
                   selectedTab === 'approved' ? '승인된 요청이 없습니다.' : '거절된 요청이 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{request.userName}</h3>
                        <p className="text-sm text-gray-500">{request.hospitalName}</p>
                        <p className="text-sm text-gray-500">{request.userEmail}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(request.submittedAt?.toDate()).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => handleApprove(selectedRequest)}
          onReject={(reason) => handleReject(selectedRequest, reason)}
          onDelete={() => handleDelete(selectedRequest.id)}
        />
      )}
    </div>
  );
};

// 상세 모달 컴포넌트
const RequestDetailModal: React.FC<{
  request: VerificationRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
}> = ({ request, onClose, onApprove, onReject, onDelete }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    onReject(rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">병원 인증 신청서</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">신청자명</label>
                <p className="mt-1 text-sm text-gray-900">{request.userName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">이메일</label>
                <p className="mt-1 text-sm text-gray-900">{request.userEmail}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">의사 면허번호</label>
              <p className="mt-1 text-sm text-gray-900">{request.licenseNumber}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">병원명</label>
              <p className="mt-1 text-sm text-gray-900">{request.hospitalName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">병원 주소</label>
              <p className="mt-1 text-sm text-gray-900">{request.hospitalAddress}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">병원 전화번호</label>
              <p className="mt-1 text-sm text-gray-900">{request.hospitalPhone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">전문 분야</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {request.specialization.map((spec, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">경력</label>
              <p className="mt-1 text-sm text-gray-900">{request.experience}년</p>
            </div>

            {request.additionalInfo && (
              <div>
                <label className="block text-sm font-medium text-gray-700">추가 정보</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{request.additionalInfo}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">신청일</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(request.submittedAt?.toDate()).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>

          {/* 거절 사유 입력 폼 */}
          {showRejectForm && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-medium text-red-700 mb-2">거절 사유</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-red-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="거절 사유를 입력해주세요..."
              />
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={handleRejectSubmit}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                  거절 처리
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={onDelete}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm"
            >
              삭제
            </button>
            
            <div className="flex space-x-3">
              {request.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
                  >
                    거절
                  </button>
                  <button
                    onClick={onApprove}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    승인
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;