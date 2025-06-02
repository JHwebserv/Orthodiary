// src/types/user.ts

export type UserType = 'patient' | 'doctor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: UserType;
  isProfileComplete: boolean;
  
  // 환자 정보
  patientInfo?: {
    birthDate?: string;
    phone?: string;
    parentName?: string; // 미성년자의 경우 보호자명
    parentPhone?: string;
    connectedDoctorId?: string; // 연결된 의사 ID
    treatmentStartDate?: string;
    treatmentType?: string; // 교정 타입 (메탈, 세라믹, 투명교정 등)
  };
  
  // 의사 정보
  doctorInfo?: {
    licenseNumber: string; // 면허번호
    hospitalName: string;
    hospitalAddress: string;
    hospitalPhone: string;
    specialization: string[]; // 전문분야
    experience: number; // 경력년수
    isVerified: boolean; // 병원 인증 여부
    verificationStatus?: 'pending' | 'approved' | 'rejected'; // 승인 상태 추가
    submittedAt?: Date; // 신청일
  };
  
  createdAt: Date;
  updatedAt: Date;
}