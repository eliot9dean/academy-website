export type UserRole = 'admin' | 'teacher' | 'staff' | 'parent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar?: string;
  ssn?: string;
  address?: string;
  joinDate?: string;
  resignDate?: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;  // 학년
  school: string;
  parentName: string;
  studentPhone?: string;
  parentPhone: string;
  enrollDate: string;
  status: 'enrolled' | 'withdrawn';
  withdrawDate?: string;
  withdrawReason?: string;
  classIds: string[];
  tuitionPaid: boolean;
  tuitionDueDate: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';

export interface AttendanceRecord {
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  teacherId: string;
  subject: string;
  days: string[];        // ['월','수','금']
  startTime: string;    // '16:00'
  endTime: string;      // '18:00'
  studentIds: string[];
  grade: string;
  cardColorIdx?: number; // 카드 색상 팔레트 인덱스 (Supabase 동기화)
}

export interface DailyProgress {
  classId: string;
  date: string;
  content: string;
  homework: string;
  teacherNote: string;
  parentMessage: string;
}

export interface HomeworkResult {
  studentId: string;
  classId: string;
  date: string;
  result: 'excellent' | 'good' | 'poor' | 'not_submitted';
  note?: string;
}

export interface ObservationRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  note: string;
  parentNote: string;
}

export interface TestScore {
  studentId: string;
  classId: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly';
  score: number;
  maxScore: number;
  testName: string;
  /** 주간/월간 시험의 분야 목록 (예: ['단어','듣기','읽기']) */
  fields?: string[];
  /** 분야별 점수 맵 (분야명 → 점수) */
  subScores?: Record<string, number>;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'consultation' | 'meeting' | 'event' | 'external';
  personName: string;
  personType: '학부모' | '강사' | '외부업체' | '기타';
  content: string;
  phone?: string;
}

export interface ConsultationRecord {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  date: string;
  result: 'registered' | 'pending' | 'declined';
  contactForEvents: boolean;
  source: string;
  notes?: string;
}

/** 수강관리 DB — 학생별 반·수강료·교재 월별 납부 이력 */
export interface EnrollmentMgmt {
  id: string;
  studentId: string;
  classId: string;

  // 수강 기간 (이 반에서의 전체 기간)
  enrollStartDate: string;       // YYYY-MM-DD
  enrollEndDate: string | null;  // null = 현재 재원 중

  // 수강료 (이 레코드가 나타내는 달)
  paymentMonth: string;          // YYYY-MM
  tuitionFee: number;            // 월 수강료 (원)
  tuitionDueDate: string;        // 납부 기한
  tuitionPaid: boolean;
  tuitionPaidDate?: string;      // 실제 납부일

  // 교재 (해당 월에 교재 구입이 있는 경우만)
  textbookName?: string;
  textbookPublisher?: string;
  textbookFee?: number;
  textbookPaid?: boolean;
  textbookPaidDate?: string;
  /** true = 학생 개인 구매 (학원 미구매) */
  textbookNotPurchased?: boolean;
  /** 반별 교재 목록 기반 납부 이력 (textbookId → paid 여부) */
  textbookPayments?: Record<string, { paid: boolean; paidDate?: string }>;

  memo?: string;
}

export interface ClassHistoryRecord {
  id: string;
  studentId: string;
  classId: string;       // 현재 존재하지 않는 반이면 빈 문자열
  className: string;     // 반 이름 (반이 삭제돼도 보존)
  startDate: string;     // YYYY-MM-DD
  endDate: string | null; // null = 현재 수강 중
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'fixed_expense' | 'variable_expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  studentId?: string;
}

export interface Textbook {
  id: string;
  name: string;
  publisher?: string;
  price: number;
  subject?: string; // '영어' | '수학' | '국어' 등
}

export interface DailyReportStatus {
  classId: string;
  date: string;
  studentId: string;
  sent: boolean;
  sentAt?: string;
  parentPhone: string;
  note?: string;
}

/** 반별 수강료·교재 설정 (DB 관리) */
export interface ClassConfig {
  id: string;         // = classId (반 당 1개)
  classId: string;
  tuitionFee: number;
  textbookIds: string[];
}

/** 반별 공지사항 (DB 관리, 여러 개 가능) */
export interface ClassNotice {
  id: string;
  classId: string;
  text: string;
}

/** 재무 메모 (DB 관리) */
export interface FinanceMemo {
  id: string;
  date: string;   // YYYY-MM-DD
  text: string;
}

/** 반별 기타 설정 (시험분야, 출결 메시지, 성적표 코멘트) */
export interface ClassSettings {
  id: string;       // = classId
  classId: string;
  examFields: string[];                   // 시험 분야 목록
  examMaxScore?: string;                  // 분야별 만점 (기본 100)
  attMsgTemplates: Record<string, string>; // AttendanceStatus → 메시지 템플릿
  reportComments: Record<string, string>;  // studentId → 코멘트
}
