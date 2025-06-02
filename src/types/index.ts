// src/types/index.ts

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  userType: 'patient' | 'doctor';
  isActive: boolean;
  createdAt: Date;
  hospitalId?: string; // 연결된 병원 ID (환자의 경우)
  licenseNumber?: string; // 의사 면허번호 (의사의 경우)
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: Date;
  title: string;
  content: string;
  photos: string[]; // Storage URL 배열
  painLevel: number; // 1-10 통증 레벨
  symptoms: string[]; // 증상 배열
  medications: string[]; // 복용 약물
  nextAppointment?: Date;
  isSharedWithDoctor: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  doctorIds: string[]; // 소속 의사들 ID
  isActive: boolean;
  createdAt: Date;
}

export interface DoctorPatientConnection {
  id: string;
  doctorId: string;
  patientId: string;
  hospitalId: string;
  connectionDate: Date;
  isActive: boolean;
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  messageType: 'text' | 'image' | 'appointment';
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  date: Date;
  duration: number; // 분 단위
  type: 'checkup' | 'adjustment' | 'consultation';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

// types/index.ts
export interface OrthoPhoto {
  id: string;
  data: string;
  timestamp: string;
  memo: string;
  isStarred?: boolean;
  userId: string;
  deleted?: boolean;
}

export type ViewType = 'home' | 'dateDetail' | 'camera' | 'detail';

export interface PhotosByDate {
  [key: string]: OrthoPhoto[];
}