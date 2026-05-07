import type {
  User, Student, ClassInfo, AttendanceRecord, DailyProgress,
  HomeworkResult, TestScore, ScheduleEvent, ConsultationRecord,
  FinancialRecord, DailyReportStatus, ClassHistoryRecord, EnrollmentMgmt,
  ObservationRecord, Textbook, ClassConfig, ClassNotice, FinanceMemo, ClassSettings,
} from '../types';

// ─── USERS ────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 'u1', name: '김원장', role: 'admin',   email: 'admin@academy.com',    phone: '010-1234-5678', ssn: '750305-1234567', address: '서울시 강남구 역삼동 123-45 삼성아파트 101동 302호',          joinDate: '2019-03-02' },
  { id: 'u2', name: '이수진', role: 'teacher', email: 'teacher1@academy.com', phone: '010-2345-6789', ssn: '880612-2345678', address: '서울시 서초구 서초동 234-56 서초빌라 202호',                     joinDate: '2020-09-01' },
  { id: 'u3', name: '박민호', role: 'teacher', email: 'teacher2@academy.com', phone: '010-3456-7890', ssn: '850919-1456789', address: '서울시 송파구 잠실동 345-67 잠실롯데캐슬 305동 801호',           joinDate: '2021-03-02' },
  { id: 'u4', name: '최지혜', role: 'teacher', email: 'teacher3@academy.com', phone: '010-4567-8901', ssn: '901224-2567890', address: '경기도 성남시 분당구 정자동 456-78 정자아이파크 102동 504호',    joinDate: '2022-09-01' },
  { id: 'u5', name: '정서연', role: 'staff',   email: 'staff@academy.com',    phone: '010-5678-9012', ssn: '950315-2678901', address: '서울시 마포구 합정동 567-89 합정메세나폴리스 A동 1203호',        joinDate: '2023-01-02' },
  { id: 'u6', name: '김학부', role: 'parent',  email: 'parent1@gmail.com',    phone: '010-6789-0123', ssn: '780430-1789012', address: '경기도 용인시 수지구 풍덕천동 678-90 수지현대아파트 201동 1105호' },
  // ── 테스트 계정 (isTestAccount: true — DB에 쓰기 차단) ──────────────────
  { id: 'u_ta', name: '테스트관리자', role: 'admin',   email: 'test.admin@test.com',   isTestAccount: true, joinDate: '2020-01-01' },
  { id: 'u_tt', name: '테스트선생님', role: 'teacher', email: 'test.teacher@test.com', isTestAccount: true, joinDate: '2020-01-01' },
  { id: 'u_ts', name: '테스트스탭',   role: 'staff',   email: 'test.staff@test.com',   isTestAccount: true, joinDate: '2020-01-01' },
  { id: 'u_tp', name: '테스트학부모', role: 'parent',  email: 'test.parent@test.com',  isTestAccount: true },
];

// ─── STUDENTS ─────────────────────────────────────────────────
export const mockStudents: Student[] = [
  { id: 's1',  name: '김민준', grade: '중1', school: '한빛중학교', parentName: '김학부',  studentPhone: '010-1001-0001', parentPhone: '010-1111-2222', enrollDate: '2024-03-01', status: 'enrolled',  classIds: ['c1','c3'],    tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's2',  name: '이서연', grade: '중1', school: '한빛중학교', parentName: '이학부',  studentPhone: '010-1001-0002', parentPhone: '010-2222-3333', enrollDate: '2024-03-01', status: 'enrolled',  classIds: ['c1'],         tuitionPaid: false, tuitionDueDate: '2026-04-15' },
  { id: 's3',  name: '박지호', grade: '중2', school: '미래중학교', parentName: '박학부',  studentPhone: '010-1001-0003', parentPhone: '010-3333-4444', enrollDate: '2024-06-01', status: 'enrolled',  classIds: ['c2'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's4',  name: '최아린', grade: '중2', school: '미래중학교', parentName: '최학부',  studentPhone: '010-1001-0004', parentPhone: '010-4444-5555', enrollDate: '2024-06-01', status: 'enrolled',  classIds: ['c2'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's5',  name: '정현우', grade: '중3', school: '별빛중학교', parentName: '정학부',  studentPhone: '010-1001-0005', parentPhone: '010-5555-6666', enrollDate: '2025-01-05', status: 'enrolled',  classIds: ['c3'],         tuitionPaid: false, tuitionDueDate: '2026-04-20' },
  { id: 's6',  name: '강수아', grade: '중1', school: '한빛중학교', parentName: '강학부',  studentPhone: '010-1001-0006', parentPhone: '010-6666-7777', enrollDate: '2025-03-01', status: 'enrolled',  classIds: ['c1','c4'],    tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's7',  name: '윤도현', grade: '중3', school: '별빛중학교', parentName: '윤학부',  studentPhone: '010-1001-0007', parentPhone: '010-7777-8888', enrollDate: '2024-09-01', status: 'withdrawn', withdrawDate: '2026-02-28', withdrawReason: '이사',     classIds: [], tuitionPaid: true,  tuitionDueDate: '2026-02-28' },
  { id: 's8',  name: '한예린', grade: '중2', school: '미래중학교', parentName: '한학부',  studentPhone: '010-1001-0008', parentPhone: '010-8888-9999', enrollDate: '2024-09-01', status: 'withdrawn', withdrawDate: '2026-03-15', withdrawReason: '성적부진', classIds: [], tuitionPaid: true,  tuitionDueDate: '2026-03-15' },
  { id: 's9',  name: '오승준', grade: '중1', school: '한빛중학교', parentName: '오학부',  studentPhone: '010-1001-0009', parentPhone: '010-9999-0000', enrollDate: '2026-01-10', status: 'enrolled',  classIds: ['c1'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's10', name: '임채원', grade: '중3', school: '별빛중학교', parentName: '임학부',  studentPhone: '010-1001-0010', parentPhone: '010-0000-1111', enrollDate: '2025-03-01', status: 'enrolled',  classIds: ['c3'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's11', name: '노지민', grade: '중1', school: '한빛중학교', parentName: '노학부',  studentPhone: '010-1001-0011', parentPhone: '010-1122-3344', enrollDate: '2025-09-01', status: 'enrolled',  classIds: ['c1'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's12', name: '백승호', grade: '중2', school: '미래중학교', parentName: '백학부',  studentPhone: '010-1001-0012', parentPhone: '010-2233-4455', enrollDate: '2025-09-01', status: 'enrolled',  classIds: ['c2'],         tuitionPaid: false, tuitionDueDate: '2026-04-18' },
  { id: 's13', name: '서하윤', grade: '중3', school: '별빛중학교', parentName: '서학부',  studentPhone: '010-1001-0013', parentPhone: '010-3344-5566', enrollDate: '2025-03-01', status: 'enrolled',  classIds: ['c3'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's14', name: '안준혁', grade: '중2', school: '미래중학교', parentName: '안학부',  studentPhone: '010-1001-0014', parentPhone: '010-4455-6677', enrollDate: '2024-03-01', status: 'withdrawn', withdrawDate: '2026-01-31', withdrawReason: '타학원이동', classIds: [], tuitionPaid: true, tuitionDueDate: '2026-01-31' },
  { id: 's15', name: '조민서', grade: '중1', school: '한빛중학교', parentName: '조학부',  studentPhone: '010-1001-0015', parentPhone: '010-5566-7788', enrollDate: '2025-03-01', status: 'enrolled',  classIds: ['c1','c4'],    tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's16', name: '권태윤', grade: '중2', school: '미래중학교',  parentName: '권학부', studentPhone: '010-1001-0016', parentPhone: '010-6677-8899', enrollDate: '2024-03-01', status: 'withdrawn', withdrawDate: '2025-10-31', withdrawReason: '타학원이동', classIds: [], tuitionPaid: true,  tuitionDueDate: '2025-10-31' },
  { id: 's17', name: '문소희', grade: '중1', school: '한빛중학교',  parentName: '문학부', studentPhone: '010-1001-0017', parentPhone: '010-7788-9900', enrollDate: '2025-03-01', status: 'withdrawn', withdrawDate: '2025-11-30', withdrawReason: '성적부진',  classIds: [], tuitionPaid: true,  tuitionDueDate: '2025-11-30' },
  { id: 's18', name: '신동우', grade: '중3', school: '별빛중학교',  parentName: '신학부', studentPhone: '010-1001-0018', parentPhone: '010-8899-0011', enrollDate: '2024-09-01', status: 'withdrawn', withdrawDate: '2025-11-15', withdrawReason: '이사',      classIds: [], tuitionPaid: true,  tuitionDueDate: '2025-11-15' },
  { id: 's19', name: '유나리', grade: '중2', school: '미래중학교',  parentName: '유학부', studentPhone: '010-1001-0019', parentPhone: '010-9900-1122', enrollDate: '2024-06-01', status: 'withdrawn', withdrawDate: '2025-12-20', withdrawReason: '경제적사유', classIds: [], tuitionPaid: true,  tuitionDueDate: '2025-12-20' },
  { id: 's20', name: '차준호', grade: '중1', school: '한빛중학교',  parentName: '차학부', studentPhone: '010-1001-0020', parentPhone: '010-0011-2233', enrollDate: '2025-09-01', status: 'withdrawn', withdrawDate: '2026-01-15', withdrawReason: '타학원이동', classIds: [], tuitionPaid: true,  tuitionDueDate: '2026-01-15' },
  // ── 테스트 계정용 학생 ────────────────────────────────────────────────
  { id: 's_t1', name: '테스트학생1', grade: '중1', school: '테스트중학교', parentName: '테스트학부모', studentPhone: '010-0000-0001', parentPhone: '010-0000-0010', enrollDate: '2026-03-01', status: 'enrolled', classIds: ['c_t1','c_t2'], tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's_t2', name: '테스트학생2', grade: '중1', school: '테스트중학교', parentName: '테스트학부모', studentPhone: '010-0000-0002', parentPhone: '010-0000-0010', enrollDate: '2026-03-01', status: 'enrolled', classIds: ['c_t1'],         tuitionPaid: false, tuitionDueDate: '2026-04-25' },
  { id: 's_t3', name: '테스트학생3', grade: '중1', school: '테스트중학교', parentName: '테스트다른학부모', studentPhone: '010-0000-0003', parentPhone: '010-0000-0020', enrollDate: '2026-03-01', status: 'enrolled', classIds: ['c_t1'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  { id: 's_t4', name: '테스트학생4', grade: '중2', school: '테스트중학교', parentName: '테스트학부모', studentPhone: '010-0000-0004', parentPhone: '010-0000-0010', enrollDate: '2026-03-01', status: 'enrolled', classIds: ['c_t2'],         tuitionPaid: true,  tuitionDueDate: '2026-05-01' },
  // ── 4월 퇴원 학생 (퇴원 분석 더미) ──────────────────────────────────
  { id: 's21', name: '고은별', grade: '중2', school: '별빛중학교',  parentName: '고학부', studentPhone: '010-1001-0021', parentPhone: '010-1122-4433', enrollDate: '2024-09-01', status: 'withdrawn', withdrawDate: '2026-04-05', withdrawReason: '타학원이동', classIds: [], tuitionPaid: true,  tuitionDueDate: '2026-04-05' },
  { id: 's22', name: '남기준', grade: '중1', school: '한빛중학교',  parentName: '남학부', studentPhone: '010-1001-0022', parentPhone: '010-2233-5544', enrollDate: '2025-03-01', status: 'withdrawn', withdrawDate: '2026-04-12', withdrawReason: '경제적사유', classIds: [], tuitionPaid: false, tuitionDueDate: '2026-04-12' },
  { id: 's23', name: '류지안', grade: '중3', school: '미래중학교',  parentName: '류학부', studentPhone: '010-1001-0023', parentPhone: '010-3344-6655', enrollDate: '2024-03-01', status: 'withdrawn', withdrawDate: '2026-04-18', withdrawReason: '이사',       classIds: [], tuitionPaid: true,  tuitionDueDate: '2026-04-18' },
  { id: 's24', name: '마서준', grade: '중2', school: '별빛중학교',  parentName: '마학부', studentPhone: '010-1001-0024', parentPhone: '010-4455-7766', enrollDate: '2025-09-01', status: 'withdrawn', withdrawDate: '2026-04-23', withdrawReason: '성적부진',  classIds: [], tuitionPaid: true,  tuitionDueDate: '2026-04-23' },
  { id: 's25', name: '배수진', grade: '중1', school: '한빛중학교',  parentName: '배학부', studentPhone: '010-1001-0025', parentPhone: '010-5566-8877', enrollDate: '2025-09-01', status: 'withdrawn', withdrawDate: '2026-04-30', withdrawReason: '타학원이동', classIds: [], tuitionPaid: true,  tuitionDueDate: '2026-04-30' },
];

// ─── CLASSES ──────────────────────────────────────────────────
export const mockClasses: ClassInfo[] = [
  { id: 'c1', name: '중1 영어 A반', teacherId: 'u2', subject: '영어', days: ['월','수','금'], startTime: '16:00', endTime: '17:30', studentIds: ['s1','s2','s6','s9','s11','s15'],       grade: '중1' },
  { id: 'c2', name: '중2 수학 B반', teacherId: 'u3', subject: '수학', days: ['화','목'],     startTime: '17:00', endTime: '19:00', studentIds: ['s3','s4','s12'],                    grade: '중2' },
  { id: 'c3', name: '중3 국어 C반', teacherId: 'u4', subject: '국어', days: ['월','목'],     startTime: '19:00', endTime: '21:00', studentIds: ['s1','s5','s10','s13'],             grade: '중3' },
  { id: 'c4', name: '중1 영어 D반', teacherId: 'u2', subject: '영어', days: ['화','수','목'], startTime: '11:00', endTime: '12:30', studentIds: ['s6','s15'],                        grade: '중1' },
  // ── 테스트 선생님(u_tt) 담당 반 ─────────────────────────────────────────────
  { id: 'c_t1', name: '테스트 영어반', teacherId: 'u_tt', subject: '영어', days: ['월','수','금'], startTime: '16:00', endTime: '17:30', studentIds: ['s_t1','s_t2','s_t3'], grade: '중1' },
  { id: 'c_t2', name: '테스트 수학반', teacherId: 'u_tt', subject: '수학', days: ['화','목'],     startTime: '17:00', endTime: '19:00', studentIds: ['s_t1','s_t4'],          grade: '중2' },
];

// ─── ATTENDANCE ───────────────────────────────────────────────
const makeAtt = (classId: string, studentId: string, date: string, status: AttendanceRecord['status'], note?: string): AttendanceRecord =>
  ({ classId, studentId, date, status, note });
const c1 = (sid: string, date: string, st: AttendanceRecord['status'], note?: string) => makeAtt('c1', sid, date, st, note);
const c2 = (sid: string, date: string, st: AttendanceRecord['status'], note?: string) => makeAtt('c2', sid, date, st, note);
const c3 = (sid: string, date: string, st: AttendanceRecord['status'], note?: string) => makeAtt('c3', sid, date, st, note);
const c4 = (sid: string, date: string, st: AttendanceRecord['status'], note?: string) => makeAtt('c4', sid, date, st, note);

export const mockAttendance: AttendanceRecord[] = [
  // ── 2026-01 ──
  ...(['s1','s2','s6','s9','s11','s15'] as const).flatMap(sid => [
    c1(sid, '2026-01-05', sid === 's2' ? 'absent' : 'present'),
    c1(sid, '2026-01-07', sid === 's11' ? 'late' : 'present'),
    c1(sid, '2026-01-09', 'present'),
    c1(sid, '2026-01-12', sid === 's9' ? 'absent' : 'present'),
    c1(sid, '2026-01-14', 'present'),
    c1(sid, '2026-01-16', sid === 's15' ? 'early_leave' : 'present'),
    c1(sid, '2026-01-19', 'present'),
    c1(sid, '2026-01-21', 'present'),
    c1(sid, '2026-01-23', sid === 's2' ? 'late' : 'present'),
    c1(sid, '2026-01-26', 'present'),
  ]),
  ...(['s3','s4','s12'] as const).flatMap(sid => [
    c2(sid, '2026-01-06', 'present'),
    c2(sid, '2026-01-08', sid === 's12' ? 'absent' : 'present'),
    c2(sid, '2026-01-13', 'present'),
    c2(sid, '2026-01-15', 'present'),
    c2(sid, '2026-01-20', sid === 's4' ? 'late' : 'present'),
    c2(sid, '2026-01-22', 'present'),
    c2(sid, '2026-01-27', 'present'),
    c2(sid, '2026-01-29', 'present'),
  ]),
  ...(['s1','s5','s10','s13'] as const).flatMap(sid => [
    c3(sid, '2026-01-05', 'present'),
    c3(sid, '2026-01-08', sid === 's5' ? 'absent' : 'present'),
    c3(sid, '2026-01-12', 'present'),
    c3(sid, '2026-01-15', 'present'),
    c3(sid, '2026-01-19', sid === 's13' ? 'late' : 'present'),
    c3(sid, '2026-01-22', 'present'),
    c3(sid, '2026-01-26', 'present'),
    c3(sid, '2026-01-29', 'present'),
  ]),

  // ── 2026-02 ──
  ...(['s1','s2','s6','s9','s11','s15'] as const).flatMap(sid => [
    c1(sid, '2026-02-02', sid === 's2' ? 'absent' : 'present'),
    c1(sid, '2026-02-04', 'present'),
    c1(sid, '2026-02-06', sid === 's9' ? 'late' : 'present'),
    c1(sid, '2026-02-09', 'present'),
    c1(sid, '2026-02-11', 'present'),
    c1(sid, '2026-02-13', sid === 's11' ? 'absent' : 'present'),
    c1(sid, '2026-02-16', 'present'),
    c1(sid, '2026-02-18', 'present'),
    c1(sid, '2026-02-23', 'present'),
    c1(sid, '2026-02-25', sid === 's6' ? 'early_leave' : 'present'),
  ]),
  ...(['s3','s4','s12'] as const).flatMap(sid => [
    c2(sid, '2026-02-03', 'present'),
    c2(sid, '2026-02-05', sid === 's12' ? 'late' : 'present'),
    c2(sid, '2026-02-10', 'present'),
    c2(sid, '2026-02-12', 'present'),
    c2(sid, '2026-02-17', sid === 's3' ? 'absent' : 'present'),
    c2(sid, '2026-02-19', 'present'),
    c2(sid, '2026-02-24', 'present'),
    c2(sid, '2026-02-26', 'present'),
  ]),
  ...(['s1','s5','s10','s13'] as const).flatMap(sid => [
    c3(sid, '2026-02-02', 'present'),
    c3(sid, '2026-02-05', 'present'),
    c3(sid, '2026-02-09', sid === 's5' ? 'absent' : 'present'),
    c3(sid, '2026-02-12', 'present'),
    c3(sid, '2026-02-16', 'present'),
    c3(sid, '2026-02-19', sid === 's13' ? 'late' : 'present'),
    c3(sid, '2026-02-23', 'present'),
    c3(sid, '2026-02-26', 'present'),
  ]),

  // ── 2026-03 ──
  ...(['s1','s2','s6','s9','s11','s15'] as const).flatMap(sid => [
    c1(sid, '2026-03-02', sid === 's9' ? 'late' : 'present'),
    c1(sid, '2026-03-04', 'present'),
    c1(sid, '2026-03-06', 'present'),
    c1(sid, '2026-03-09', sid === 's2' ? 'absent' : 'present'),
    c1(sid, '2026-03-11', 'present'),
    c1(sid, '2026-03-13', sid === 's15' ? 'late' : 'present'),
    c1(sid, '2026-03-16', 'present'),
    c1(sid, '2026-03-18', 'present'),
    c1(sid, '2026-03-20', 'present'),
    c1(sid, '2026-03-23', sid === 's11' ? 'absent' : 'present'),
    c1(sid, '2026-03-25', 'present'),
    c1(sid, '2026-03-27', 'present'),
  ]),
  ...(['s3','s4','s12'] as const).flatMap(sid => [
    c2(sid, '2026-03-03', 'present'),
    c2(sid, '2026-03-05', sid === 's12' ? 'absent' : 'present'),
    c2(sid, '2026-03-10', 'present'),
    c2(sid, '2026-03-12', 'present'),
    c2(sid, '2026-03-17', sid === 's4' ? 'late' : 'present'),
    c2(sid, '2026-03-19', 'present'),
    c2(sid, '2026-03-24', 'present'),
    c2(sid, '2026-03-26', 'present'),
  ]),
  ...(['s1','s5','s10','s13'] as const).flatMap(sid => [
    c3(sid, '2026-03-02', 'present'),
    c3(sid, '2026-03-05', sid === 's5' ? 'absent' : 'present'),
    c3(sid, '2026-03-09', 'present'),
    c3(sid, '2026-03-12', 'present'),
    c3(sid, '2026-03-16', 'present'),
    c3(sid, '2026-03-19', sid === 's13' ? 'absent' : 'present'),
    c3(sid, '2026-03-23', 'present'),
    c3(sid, '2026-03-26', 'present'),
    c3(sid, '2026-03-30', 'present'),
  ]),

  // ── 2026-04 c1 (월/수/금: s1,s2,s6,s9,s11,s15) ──
  c1('s1','2026-04-01','present'), c1('s2','2026-04-01','present'), c1('s6','2026-04-01','present'),
  c1('s9','2026-04-01','late','버스 지연'), c1('s11','2026-04-01','present'), c1('s15','2026-04-01','present'),
  c1('s1','2026-04-03','present'), c1('s2','2026-04-03','present'), c1('s6','2026-04-03','present'),
  c1('s9','2026-04-03','present'), c1('s11','2026-04-03','absent','감기'), c1('s15','2026-04-03','present'),
  c1('s1','2026-04-06','present'), c1('s2','2026-04-06','present'), c1('s6','2026-04-06','early_leave','가족행사'),
  c1('s9','2026-04-06','present'), c1('s11','2026-04-06','present'), c1('s15','2026-04-06','present'),
  c1('s1','2026-04-08','present'), c1('s2','2026-04-08','absent','감기'), c1('s6','2026-04-08','present'),
  c1('s9','2026-04-08','absent','병원'), c1('s11','2026-04-08','present'), c1('s15','2026-04-08','present'),
  c1('s1','2026-04-10','present'), c1('s2','2026-04-10','present'), c1('s6','2026-04-10','late','교통체증'),
  c1('s9','2026-04-10','present'), c1('s11','2026-04-10','present'), c1('s15','2026-04-10','present'),
  c1('s1','2026-04-13','present'), c1('s2','2026-04-13','present'), c1('s6','2026-04-13','present'),
  c1('s9','2026-04-13','present'), c1('s11','2026-04-13','present'), c1('s15','2026-04-13','late','지각'),
  c1('s1','2026-04-15','present'), c1('s2','2026-04-15','present'), c1('s6','2026-04-15','present'),
  c1('s9','2026-04-15','present'), c1('s11','2026-04-15','absent','결석'), c1('s15','2026-04-15','present'),
  c1('s1','2026-04-17','present'), c1('s2','2026-04-17','present'), c1('s6','2026-04-17','present'),
  c1('s9','2026-04-17','present'), c1('s11','2026-04-17','present'), c1('s15','2026-04-17','present'),

  // ── 2026-04 c2 (화/목: s3,s4,s12) ──
  c2('s3','2026-04-02','present'), c2('s4','2026-04-02','present'), c2('s12','2026-04-02','present'),
  c2('s3','2026-04-07','present'), c2('s4','2026-04-07','early_leave','병원'), c2('s12','2026-04-07','present'),
  c2('s3','2026-04-09','present'), c2('s4','2026-04-09','present'), c2('s12','2026-04-09','absent','독감'),
  c2('s3','2026-04-14','present'), c2('s4','2026-04-14','present'), c2('s12','2026-04-14','present'),
  c2('s3','2026-04-16','present'), c2('s4','2026-04-16','late','지각'), c2('s12','2026-04-16','present'),

  // ── 2026-04 c3 (월/목: s1,s5,s10,s13) ──
  c3('s1','2026-04-02','present'), c3('s5','2026-04-02','present'), c3('s10','2026-04-02','present'), c3('s13','2026-04-02','present'),
  c3('s1','2026-04-06','present'), c3('s5','2026-04-06','absent'),  c3('s10','2026-04-06','present'), c3('s13','2026-04-06','present'),
  c3('s1','2026-04-09','present'), c3('s5','2026-04-09','present'), c3('s10','2026-04-09','late','버스'), c3('s13','2026-04-09','present'),
  c3('s1','2026-04-13','present'), c3('s5','2026-04-13','present'), c3('s10','2026-04-13','present'), c3('s13','2026-04-13','present'),
  c3('s1','2026-04-16','present'), c3('s5','2026-04-16','present'), c3('s10','2026-04-16','present'), c3('s13','2026-04-16','absent','병원'),

  // ── 2026-04 c4 (화/금: s6,s15) ──
  c4('s6','2026-04-03','present'), c4('s15','2026-04-03','present'),
  c4('s6','2026-04-07','present'), c4('s15','2026-04-07','late','버스 지연'),
  c4('s6','2026-04-10','present'), c4('s15','2026-04-10','present'),
  c4('s6','2026-04-14','present'), c4('s15','2026-04-14','present'),
  c4('s6','2026-04-17','early_leave','가족행사'), c4('s15','2026-04-17','present'),

  // ── 테스트 선생님 반 출석 ──────────────────────────────────────────────────
  // c_t1 영어반 (월/수/금: s_t1, s_t2, s_t3) — 2026-03
  makeAtt('c_t1','s_t1','2026-03-02','present'), makeAtt('c_t1','s_t2','2026-03-02','present'), makeAtt('c_t1','s_t3','2026-03-02','present'),
  makeAtt('c_t1','s_t1','2026-03-04','present'), makeAtt('c_t1','s_t2','2026-03-04','late','버스 지연'), makeAtt('c_t1','s_t3','2026-03-04','present'),
  makeAtt('c_t1','s_t1','2026-03-06','present'), makeAtt('c_t1','s_t2','2026-03-06','present'), makeAtt('c_t1','s_t3','2026-03-06','absent','감기'),
  makeAtt('c_t1','s_t1','2026-03-09','present'), makeAtt('c_t1','s_t2','2026-03-09','present'), makeAtt('c_t1','s_t3','2026-03-09','present'),
  makeAtt('c_t1','s_t1','2026-03-11','late','교통체증'), makeAtt('c_t1','s_t2','2026-03-11','present'), makeAtt('c_t1','s_t3','2026-03-11','present'),
  makeAtt('c_t1','s_t1','2026-03-13','present'), makeAtt('c_t1','s_t2','2026-03-13','absent','병원'), makeAtt('c_t1','s_t3','2026-03-13','present'),
  makeAtt('c_t1','s_t1','2026-03-16','present'), makeAtt('c_t1','s_t2','2026-03-16','present'), makeAtt('c_t1','s_t3','2026-03-16','present'),
  makeAtt('c_t1','s_t1','2026-03-18','present'), makeAtt('c_t1','s_t2','2026-03-18','present'), makeAtt('c_t1','s_t3','2026-03-18','late','지각'),
  makeAtt('c_t1','s_t1','2026-03-20','present'), makeAtt('c_t1','s_t2','2026-03-20','present'), makeAtt('c_t1','s_t3','2026-03-20','present'),
  makeAtt('c_t1','s_t1','2026-03-23','present'), makeAtt('c_t1','s_t2','2026-03-23','early_leave','병원'), makeAtt('c_t1','s_t3','2026-03-23','present'),
  makeAtt('c_t1','s_t1','2026-03-25','present'), makeAtt('c_t1','s_t2','2026-03-25','present'), makeAtt('c_t1','s_t3','2026-03-25','present'),
  makeAtt('c_t1','s_t1','2026-03-27','present'), makeAtt('c_t1','s_t2','2026-03-27','present'), makeAtt('c_t1','s_t3','2026-03-27','absent','가족행사'),
  // c_t1 — 2026-04
  makeAtt('c_t1','s_t1','2026-04-01','present'), makeAtt('c_t1','s_t2','2026-04-01','present'), makeAtt('c_t1','s_t3','2026-04-01','present'),
  makeAtt('c_t1','s_t1','2026-04-03','present'), makeAtt('c_t1','s_t2','2026-04-03','late','버스'), makeAtt('c_t1','s_t3','2026-04-03','present'),
  makeAtt('c_t1','s_t1','2026-04-06','present'), makeAtt('c_t1','s_t2','2026-04-06','present'), makeAtt('c_t1','s_t3','2026-04-06','absent','가족행사'),
  makeAtt('c_t1','s_t1','2026-04-08','absent','감기'), makeAtt('c_t1','s_t2','2026-04-08','present'), makeAtt('c_t1','s_t3','2026-04-08','present'),
  makeAtt('c_t1','s_t1','2026-04-10','present'), makeAtt('c_t1','s_t2','2026-04-10','early_leave','병원'), makeAtt('c_t1','s_t3','2026-04-10','present'),
  makeAtt('c_t1','s_t1','2026-04-13','present'), makeAtt('c_t1','s_t2','2026-04-13','present'), makeAtt('c_t1','s_t3','2026-04-13','present'),
  makeAtt('c_t1','s_t1','2026-04-15','present'), makeAtt('c_t1','s_t2','2026-04-15','present'), makeAtt('c_t1','s_t3','2026-04-15','late','지각'),
  makeAtt('c_t1','s_t1','2026-04-17','present'), makeAtt('c_t1','s_t2','2026-04-17','present'), makeAtt('c_t1','s_t3','2026-04-17','present'),
  // c_t2 수학반 (화/목: s_t1, s_t4) — 2026-03
  makeAtt('c_t2','s_t1','2026-03-03','present'), makeAtt('c_t2','s_t4','2026-03-03','present'),
  makeAtt('c_t2','s_t1','2026-03-05','present'), makeAtt('c_t2','s_t4','2026-03-05','late','버스 지연'),
  makeAtt('c_t2','s_t1','2026-03-10','present'), makeAtt('c_t2','s_t4','2026-03-10','present'),
  makeAtt('c_t2','s_t1','2026-03-12','late','교통체증'), makeAtt('c_t2','s_t4','2026-03-12','present'),
  makeAtt('c_t2','s_t1','2026-03-17','present'), makeAtt('c_t2','s_t4','2026-03-17','absent','감기'),
  makeAtt('c_t2','s_t1','2026-03-19','present'), makeAtt('c_t2','s_t4','2026-03-19','present'),
  makeAtt('c_t2','s_t1','2026-03-24','present'), makeAtt('c_t2','s_t4','2026-03-24','present'),
  makeAtt('c_t2','s_t1','2026-03-26','present'), makeAtt('c_t2','s_t4','2026-03-26','early_leave','병원'),
  // c_t2 — 2026-04
  makeAtt('c_t2','s_t1','2026-04-02','present'), makeAtt('c_t2','s_t4','2026-04-02','present'),
  makeAtt('c_t2','s_t1','2026-04-07','present'), makeAtt('c_t2','s_t4','2026-04-07','late','지각'),
  makeAtt('c_t2','s_t1','2026-04-09','absent','감기'), makeAtt('c_t2','s_t4','2026-04-09','present'),
  makeAtt('c_t2','s_t1','2026-04-14','present'), makeAtt('c_t2','s_t4','2026-04-14','present'),
  makeAtt('c_t2','s_t1','2026-04-16','present'), makeAtt('c_t2','s_t4','2026-04-16','early_leave','병원'),
];

// ─── DAILY PROGRESS ───────────────────────────────────────────
export const mockDailyProgress: DailyProgress[] = [
  { classId: 'c1', date: '2026-04-14', content: '5단원 현재완료 문법 학습', homework: 'p.82~85 연습문제 풀기', teacherNote: '김민준 집중도 우수, 이서연 문법 복습 필요', parentMessage: '오늘 현재완료 문법을 배웠습니다. 숙제 꼭 확인 부탁드립니다.' },
  { classId: 'c2', date: '2026-04-15', content: '이차방정식 근의 공식', homework: '교재 p.120~125 문제 풀기', teacherNote: '박지호 매우 집중, 최아린 근의 공식 이해 필요', parentMessage: '오늘 근의 공식을 학습했습니다. 복습 부탁드립니다.' },
  { classId: 'c3', date: '2026-04-14', content: '비문학 독해 전략', homework: '지문 3개 분석 노트 작성', teacherNote: '정현우 해석력 탁월, 임채원 주제 찾기 연습 필요', parentMessage: '비문학 독해 전략을 배웠습니다.' },
  { classId: 'c1', date: '2026-04-11', content: '수동태 문법 집중 학습', homework: 'p.78~80 수동태 변환 연습', teacherNote: '전반적으로 이해도 양호', parentMessage: '오늘 수동태를 배웠습니다.' },
  { classId: 'c1', date: '2026-03-27', content: '관계대명사 who/which/that', homework: '관계대명사 작문 10문장', teacherNote: '강수아 작문 실력 향상 중', parentMessage: '관계대명사를 공부했습니다. 작문 과제 확인 부탁드립니다.' },
  // ── 테스트 반 수업 일지 ──────────────────────────────────────────────────
  { classId: 'c_t1', date: '2026-04-13', content: 'Unit 5 현재완료 문법 집중 학습', homework: 'p.60~63 연습문제 풀기', teacherNote: '테스트학생1 집중도 우수, 테스트학생2 문법 복습 필요', parentMessage: '현재완료 문법을 배웠습니다. 숙제 확인 부탁드립니다.' },
  { classId: 'c_t1', date: '2026-04-08', content: '수동태 문법 학습 및 작문 연습', homework: 'p.55~58 수동태 변환 연습', teacherNote: '전반적 이해도 양호, 테스트학생3 추가 연습 필요', parentMessage: '수동태 문법을 배웠습니다.' },
  { classId: 'c_t1', date: '2026-04-01', content: '관계대명사 심화 학습', homework: '관계대명사 작문 8문장', teacherNote: '테스트학생1 작문 실력 빠르게 향상 중', parentMessage: '관계대명사 심화 내용을 배웠습니다. 작문 과제 확인 부탁드립니다.' },
  { classId: 'c_t1', date: '2026-03-25', content: '단어 Unit 6 학습 및 받아쓰기', homework: 'Unit 6 단어 암기 (30개)', teacherNote: '세 학생 모두 단어 암기 성실히 준비함', parentMessage: '단어 테스트를 진행했습니다. 추가 복습 부탁드립니다.' },
  { classId: 'c_t2', date: '2026-04-14', content: '이차방정식 근의 공식 학습', homework: '교재 p.88~92 문제 풀기', teacherNote: '테스트학생1 이해도 높음, 테스트학생4 근의 공식 추가 연습 필요', parentMessage: '근의 공식을 학습했습니다. 복습 부탁드립니다.' },
  { classId: 'c_t2', date: '2026-04-09', content: '이차방정식 인수분해 풀이', homework: 'p.80~84 인수분해 문제', teacherNote: '전반적으로 집중도 높았음', parentMessage: '인수분해를 배웠습니다.' },
  { classId: 'c_t2', date: '2026-03-26', content: '이차방정식 기본 개념 정리', homework: 'p.68~72 개념 문제 풀기', teacherNote: '테스트학생4 서술형 답 쓰기 연습 필요', parentMessage: '이차방정식 기본을 배웠습니다.' },
];

// ─── HOMEWORK RESULTS ─────────────────────────────────────────
export const mockHomeworkResults: HomeworkResult[] = [
  // 2026-04-14 c1
  { studentId: 's1',  classId: 'c1', date: '2026-04-14', result: 'excellent' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-14', result: 'good' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-14', result: 'poor' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-14', result: 'not_submitted' },
  { studentId: 's11', classId: 'c1', date: '2026-04-14', result: 'excellent' },
  { studentId: 's15', classId: 'c1', date: '2026-04-14', result: 'good' },
  // 2026-04-11 c1
  { studentId: 's1',  classId: 'c1', date: '2026-04-11', result: 'excellent' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-11', result: 'excellent' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-11', result: 'good' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-11', result: 'not_submitted' },
  { studentId: 's11', classId: 'c1', date: '2026-04-11', result: 'good' },
  { studentId: 's15', classId: 'c1', date: '2026-04-11', result: 'excellent' },
  // 2026-04-15 c2
  { studentId: 's3',  classId: 'c2', date: '2026-04-15', result: 'excellent' },
  { studentId: 's4',  classId: 'c2', date: '2026-04-15', result: 'good' },
  { studentId: 's12', classId: 'c2', date: '2026-04-15', result: 'not_submitted' },
  // 2026-03 c1
  { studentId: 's1',  classId: 'c1', date: '2026-03-27', result: 'excellent' },
  { studentId: 's2',  classId: 'c1', date: '2026-03-27', result: 'good' },
  { studentId: 's6',  classId: 'c1', date: '2026-03-27', result: 'excellent' },
  { studentId: 's9',  classId: 'c1', date: '2026-03-27', result: 'poor' },
  { studentId: 's11', classId: 'c1', date: '2026-03-27', result: 'good' },
  { studentId: 's15', classId: 'c1', date: '2026-03-27', result: 'excellent' },
  // ── 테스트 반 숙제 결과 ──────────────────────────────────────────────────
  { studentId: 's_t1', classId: 'c_t1', date: '2026-04-13', result: 'excellent' },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-04-13', result: 'good' },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-04-13', result: 'not_submitted' },
  { studentId: 's_t1', classId: 'c_t1', date: '2026-04-08', result: 'excellent' },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-04-08', result: 'poor' },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-04-08', result: 'good' },
  { studentId: 's_t1', classId: 'c_t1', date: '2026-04-01', result: 'excellent' },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-04-01', result: 'excellent' },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-04-01', result: 'good' },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-04-14', result: 'excellent' },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-04-14', result: 'good' },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-04-09', result: 'excellent' },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-04-09', result: 'not_submitted' },
];

// ─── TEST SCORES ──────────────────────────────────────────────
export const mockTestScores: TestScore[] = [
  // ── 2026-01 daily ──
  { studentId: 's1',  classId: 'c1', date: '2026-01-09', type: 'daily', score: 85, maxScore: 100, testName: '1/9 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-01-09', type: 'daily', score: 70, maxScore: 100, testName: '1/9 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-01-09', type: 'daily', score: 88, maxScore: 100, testName: '1/9 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-01-09', type: 'daily', score: 55, maxScore: 100, testName: '1/9 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-01-09', type: 'daily', score: 78, maxScore: 100, testName: '1/9 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-01-09', type: 'daily', score: 82, maxScore: 100, testName: '1/9 단어테스트' },
  // 2026-01 weekly c1
  { studentId: 's1',  classId: 'c1', date: '2026-01-23', type: 'weekly', score: 80, maxScore: 100, testName: '1월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:16, 쓰기:16, 말하기:16 } },
  { studentId: 's2',  classId: 'c1', date: '2026-01-23', type: 'weekly', score: 65, maxScore: 100, testName: '1월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:13, 듣기:13, 읽기:13, 쓰기:13, 말하기:13 } },
  { studentId: 's6',  classId: 'c1', date: '2026-01-23', type: 'weekly', score: 82, maxScore: 100, testName: '1월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:16, 읽기:16, 쓰기:17, 말하기:16 } },
  { studentId: 's9',  classId: 'c1', date: '2026-01-23', type: 'weekly', score: 50, maxScore: 100, testName: '1월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:10, 듣기:10, 읽기:10, 쓰기:10, 말하기:10 } },
  { studentId: 's11', classId: 'c1', date: '2026-01-23', type: 'weekly', score: 73, maxScore: 100, testName: '1월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:14, 읽기:15, 쓰기:14, 말하기:15 } },
  { studentId: 's15', classId: 'c1', date: '2026-01-23', type: 'weekly', score: 77, maxScore: 100, testName: '1월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:16, 읽기:15, 쓰기:16, 말하기:15 } },
  // 2026-01 monthly c1
  { studentId: 's1',  classId: 'c1', date: '2026-01-30', type: 'monthly', score: 83, maxScore: 100, testName: '1월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:17, 쓰기:16, 말하기:16 } },
  { studentId: 's2',  classId: 'c1', date: '2026-01-30', type: 'monthly', score: 68, maxScore: 100, testName: '1월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:14, 읽기:14, 쓰기:13, 말하기:13 } },
  { studentId: 's6',  classId: 'c1', date: '2026-01-30', type: 'monthly', score: 85, maxScore: 100, testName: '1월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:17, 쓰기:17, 말하기:17 } },
  { studentId: 's9',  classId: 'c1', date: '2026-01-30', type: 'monthly', score: 54, maxScore: 100, testName: '1월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:11, 듣기:11, 읽기:11, 쓰기:10, 말하기:11 } },
  { studentId: 's11', classId: 'c1', date: '2026-01-30', type: 'monthly', score: 75, maxScore: 100, testName: '1월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:15, 읽기:15, 쓰기:15, 말하기:15 } },
  { studentId: 's15', classId: 'c1', date: '2026-01-30', type: 'monthly', score: 79, maxScore: 100, testName: '1월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:16, 쓰기:15, 말하기:16 } },

  // ── 2026-02 ──
  { studentId: 's1',  classId: 'c1', date: '2026-02-11', type: 'daily', score: 87, maxScore: 100, testName: '2/11 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-02-11', type: 'daily', score: 72, maxScore: 100, testName: '2/11 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-02-11', type: 'daily', score: 91, maxScore: 100, testName: '2/11 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-02-11', type: 'daily', score: 60, maxScore: 100, testName: '2/11 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-02-11', type: 'daily', score: 80, maxScore: 100, testName: '2/11 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-02-11', type: 'daily', score: 83, maxScore: 100, testName: '2/11 단어테스트' },
  { studentId: 's1',  classId: 'c1', date: '2026-02-20', type: 'weekly', score: 84, maxScore: 100, testName: '2월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:17, 쓰기:17, 말하기:16 } },
  { studentId: 's2',  classId: 'c1', date: '2026-02-20', type: 'weekly', score: 70, maxScore: 100, testName: '2월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:14, 읽기:14, 쓰기:14, 말하기:14 } },
  { studentId: 's6',  classId: 'c1', date: '2026-02-20', type: 'weekly', score: 87, maxScore: 100, testName: '2월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:17, 읽기:18, 쓰기:17, 말하기:17 } },
  { studentId: 's9',  classId: 'c1', date: '2026-02-20', type: 'weekly', score: 58, maxScore: 100, testName: '2월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:12, 듣기:11, 읽기:12, 쓰기:11, 말하기:12 } },
  { studentId: 's11', classId: 'c1', date: '2026-02-20', type: 'weekly', score: 78, maxScore: 100, testName: '2월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:15, 쓰기:16, 말하기:15 } },
  { studentId: 's15', classId: 'c1', date: '2026-02-20', type: 'weekly', score: 81, maxScore: 100, testName: '2월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:17, 쓰기:16, 말하기:16 } },
  { studentId: 's1',  classId: 'c1', date: '2026-02-27', type: 'monthly', score: 86, maxScore: 100, testName: '2월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:18, 쓰기:17, 말하기:17 } },
  { studentId: 's2',  classId: 'c1', date: '2026-02-27', type: 'monthly', score: 71, maxScore: 100, testName: '2월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:14, 읽기:14, 쓰기:15, 말하기:14 } },
  { studentId: 's6',  classId: 'c1', date: '2026-02-27', type: 'monthly', score: 89, maxScore: 100, testName: '2월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:18, 말하기:17 } },
  { studentId: 's9',  classId: 'c1', date: '2026-02-27', type: 'monthly', score: 62, maxScore: 100, testName: '2월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:12, 듣기:12, 읽기:12, 쓰기:13, 말하기:13 } },
  { studentId: 's11', classId: 'c1', date: '2026-02-27', type: 'monthly', score: 79, maxScore: 100, testName: '2월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:15, 쓰기:16, 말하기:16 } },
  { studentId: 's15', classId: 'c1', date: '2026-02-27', type: 'monthly', score: 82, maxScore: 100, testName: '2월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:17, 읽기:16, 쓰기:17, 말하기:16 } },

  // ── 2026-03 ──
  { studentId: 's1',  classId: 'c1', date: '2026-03-11', type: 'daily', score: 89, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-03-11', type: 'daily', score: 74, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-03-11', type: 'daily', score: 93, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-03-11', type: 'daily', score: 63, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-03-11', type: 'daily', score: 82, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-03-11', type: 'daily', score: 85, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's1',  classId: 'c1', date: '2026-03-28', type: 'weekly', score: 87, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:18, 읽기:18, 쓰기:17, 말하기:17 } },
  { studentId: 's2',  classId: 'c1', date: '2026-03-28', type: 'weekly', score: 72, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:15, 읽기:14, 쓰기:14, 말하기:15 } },
  { studentId: 's6',  classId: 'c1', date: '2026-03-28', type: 'weekly', score: 90, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:18, 말하기:18 } },
  { studentId: 's9',  classId: 'c1', date: '2026-03-28', type: 'weekly', score: 65, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:13, 듣기:13, 읽기:13, 쓰기:13, 말하기:13 } },
  { studentId: 's11', classId: 'c1', date: '2026-03-28', type: 'weekly', score: 81, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:17, 쓰기:16, 말하기:16 } },
  { studentId: 's15', classId: 'c1', date: '2026-03-28', type: 'weekly', score: 83, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:16, 읽기:17, 쓰기:17, 말하기:16 } },
  { studentId: 's1',  classId: 'c1', date: '2026-03-31', type: 'monthly', score: 90, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:18, 말하기:18 } },
  { studentId: 's2',  classId: 'c1', date: '2026-03-31', type: 'monthly', score: 74, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:15, 읽기:14, 쓰기:15, 말하기:15 } },
  { studentId: 's6',  classId: 'c1', date: '2026-03-31', type: 'monthly', score: 92, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:18, 읽기:19, 쓰기:18, 말하기:18 } },
  { studentId: 's9',  classId: 'c1', date: '2026-03-31', type: 'monthly', score: 68, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:13, 읽기:14, 쓰기:14, 말하기:13 } },
  { studentId: 's11', classId: 'c1', date: '2026-03-31', type: 'monthly', score: 83, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:16, 쓰기:17, 말하기:16 } },
  { studentId: 's15', classId: 'c1', date: '2026-03-31', type: 'monthly', score: 85, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:18, 읽기:17, 쓰기:17, 말하기:16 } },

  // ── 2026-03 하반월 ~ 2026-04 데일리테스트 (지난 한달) ──

  // ── c1 영어 A반 (월/수/금 : s1,s2,s6,s9,s11,s15) ──
  // 03-18 (수) 단어테스트 Unit5
  { studentId: 's1',  classId: 'c1', date: '2026-03-18', type: 'daily', score: 86, maxScore: 100, testName: '3/18 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-03-18', type: 'daily', score: 70, maxScore: 100, testName: '3/18 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-03-18', type: 'daily', score: 91, maxScore: 100, testName: '3/18 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-03-18', type: 'daily', score: 59, maxScore: 100, testName: '3/18 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-03-18', type: 'daily', score: 79, maxScore: 100, testName: '3/18 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-03-18', type: 'daily', score: 83, maxScore: 100, testName: '3/18 단어테스트' },
  // 03-23 (월) 문법퀴즈 수동태
  { studentId: 's1',  classId: 'c1', date: '2026-03-23', type: 'daily', score: 84, maxScore: 100, testName: '3/23 문법퀴즈' },
  { studentId: 's2',  classId: 'c1', date: '2026-03-23', type: 'daily', score: 68, maxScore: 100, testName: '3/23 문법퀴즈' },
  { studentId: 's6',  classId: 'c1', date: '2026-03-23', type: 'daily', score: 93, maxScore: 100, testName: '3/23 문법퀴즈' },
  { studentId: 's9',  classId: 'c1', date: '2026-03-23', type: 'daily', score: 62, maxScore: 100, testName: '3/23 문법퀴즈' },
  { studentId: 's11', classId: 'c1', date: '2026-03-23', type: 'daily', score: 81, maxScore: 100, testName: '3/23 문법퀴즈' },
  { studentId: 's15', classId: 'c1', date: '2026-03-23', type: 'daily', score: 85, maxScore: 100, testName: '3/23 문법퀴즈' },
  // 03-27 (금) 단어테스트 Unit6
  { studentId: 's1',  classId: 'c1', date: '2026-03-27', type: 'daily', score: 88, maxScore: 100, testName: '3/27 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-03-27', type: 'daily', score: 72, maxScore: 100, testName: '3/27 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-03-27', type: 'daily', score: 94, maxScore: 100, testName: '3/27 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-03-27', type: 'daily', score: 64, maxScore: 100, testName: '3/27 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-03-27', type: 'daily', score: 82, maxScore: 100, testName: '3/27 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-03-27', type: 'daily', score: 86, maxScore: 100, testName: '3/27 단어테스트' },
  // 04-01 (수) 문법퀴즈 관계대명사
  { studentId: 's1',  classId: 'c1', date: '2026-04-01', type: 'daily', score: 89, maxScore: 100, testName: '4/1 문법퀴즈' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-01', type: 'daily', score: 73, maxScore: 100, testName: '4/1 문법퀴즈' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-01', type: 'daily', score: 94, maxScore: 100, testName: '4/1 문법퀴즈' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-01', type: 'daily', score: 66, maxScore: 100, testName: '4/1 문법퀴즈' },
  { studentId: 's11', classId: 'c1', date: '2026-04-01', type: 'daily', score: 83, maxScore: 100, testName: '4/1 문법퀴즈' },
  { studentId: 's15', classId: 'c1', date: '2026-04-01', type: 'daily', score: 87, maxScore: 100, testName: '4/1 문법퀴즈' },
  // 04-06 (월) 단어테스트 Unit7
  { studentId: 's1',  classId: 'c1', date: '2026-04-06', type: 'daily', score: 90, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-06', type: 'daily', score: 74, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-06', type: 'daily', score: 96, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-06', type: 'daily', score: 68, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-04-06', type: 'daily', score: 84, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-04-06', type: 'daily', score: 87, maxScore: 100, testName: '4/6 단어테스트' },
  // 04-08 (수) 문법퀴즈 현재완료
  { studentId: 's1',  classId: 'c1', date: '2026-04-08', type: 'daily', score: 91, maxScore: 100, testName: '4/8 문법퀴즈' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-08', type: 'daily', score: 75, maxScore: 100, testName: '4/8 문법퀴즈' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-08', type: 'daily', score: 95, maxScore: 100, testName: '4/8 문법퀴즈' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-08', type: 'daily', score: 69, maxScore: 100, testName: '4/8 문법퀴즈' },
  { studentId: 's11', classId: 'c1', date: '2026-04-08', type: 'daily', score: 85, maxScore: 100, testName: '4/8 문법퀴즈' },
  { studentId: 's15', classId: 'c1', date: '2026-04-08', type: 'daily', score: 88, maxScore: 100, testName: '4/8 문법퀴즈' },
  // 04-10 (금) 단어테스트 Unit8
  { studentId: 's1',  classId: 'c1', date: '2026-04-10', type: 'daily', score: 92, maxScore: 100, testName: '4/10 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-10', type: 'daily', score: 75, maxScore: 100, testName: '4/10 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-10', type: 'daily', score: 95, maxScore: 100, testName: '4/10 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-10', type: 'daily', score: 70, maxScore: 100, testName: '4/10 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-04-10', type: 'daily', score: 85, maxScore: 100, testName: '4/10 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-04-10', type: 'daily', score: 88, maxScore: 100, testName: '4/10 단어테스트' },
  // 04-13 (월) 문법퀴즈 현재완료2
  { studentId: 's1',  classId: 'c1', date: '2026-04-13', type: 'daily', score: 93, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-13', type: 'daily', score: 77, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-13', type: 'daily', score: 97, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-13', type: 'daily', score: 71, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's11', classId: 'c1', date: '2026-04-13', type: 'daily', score: 86, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's15', classId: 'c1', date: '2026-04-13', type: 'daily', score: 89, maxScore: 100, testName: '4/13 문법퀴즈' },
  // 04-15 (수) 단어테스트 Unit9
  { studentId: 's1',  classId: 'c1', date: '2026-04-15', type: 'daily', score: 91, maxScore: 100, testName: '4/15 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-15', type: 'daily', score: 76, maxScore: 100, testName: '4/15 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-15', type: 'daily', score: 96, maxScore: 100, testName: '4/15 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-15', type: 'daily', score: 72, maxScore: 100, testName: '4/15 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-04-15', type: 'daily', score: 84, maxScore: 100, testName: '4/15 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-04-15', type: 'daily', score: 90, maxScore: 100, testName: '4/15 단어테스트' },
  // 04-17 (금) 문법퀴즈 5단원 복습
  { studentId: 's1',  classId: 'c1', date: '2026-04-17', type: 'daily', score: 94, maxScore: 100, testName: '4/17 문법퀴즈' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-17', type: 'daily', score: 78, maxScore: 100, testName: '4/17 문법퀴즈' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-17', type: 'daily', score: 98, maxScore: 100, testName: '4/17 문법퀴즈' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-17', type: 'daily', score: 73, maxScore: 100, testName: '4/17 문법퀴즈' },
  { studentId: 's11', classId: 'c1', date: '2026-04-17', type: 'daily', score: 87, maxScore: 100, testName: '4/17 문법퀴즈' },
  { studentId: 's15', classId: 'c1', date: '2026-04-17', type: 'daily', score: 91, maxScore: 100, testName: '4/17 문법퀴즈' },
  // c1 주간/월간 — 분야: 단어(20) 듣기(20) 읽기(20) 쓰기(20) 말하기(20) = 100점
  // 4월 1주 주간테스트 (4/6)
  { studentId: 's1',  classId: 'c1', date: '2026-04-06', type: 'weekly', score: 88, maxScore: 100, testName: '4월 1주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:18, 읽기:18, 쓰기:18, 말하기:17 } },
  { studentId: 's2',  classId: 'c1', date: '2026-04-06', type: 'weekly', score: 72, maxScore: 100, testName: '4월 1주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:15, 읽기:14, 쓰기:15, 말하기:14 } },
  { studentId: 's6',  classId: 'c1', date: '2026-04-06', type: 'weekly', score: 91, maxScore: 100, testName: '4월 1주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:19, 읽기:18, 쓰기:18, 말하기:18 } },
  { studentId: 's9',  classId: 'c1', date: '2026-04-06', type: 'weekly', score: 65, maxScore: 100, testName: '4월 1주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:12, 듣기:13, 읽기:13, 쓰기:14, 말하기:13 } },
  { studentId: 's11', classId: 'c1', date: '2026-04-06', type: 'weekly', score: 83, maxScore: 100, testName: '4월 1주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:16, 쓰기:17, 말하기:16 } },
  { studentId: 's15', classId: 'c1', date: '2026-04-06', type: 'weekly', score: 86, maxScore: 100, testName: '4월 1주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:18, 쓰기:17, 말하기:17 } },
  // 4월 2주 주간테스트 (4/13)
  { studentId: 's1',  classId: 'c1', date: '2026-04-13', type: 'weekly', score: 90, maxScore: 100, testName: '4월 2주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:18, 말하기:18 } },
  { studentId: 's2',  classId: 'c1', date: '2026-04-13', type: 'weekly', score: 74, maxScore: 100, testName: '4월 2주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:15, 읽기:14, 쓰기:15, 말하기:15 } },
  { studentId: 's6',  classId: 'c1', date: '2026-04-13', type: 'weekly', score: 93, maxScore: 100, testName: '4월 2주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:19, 읽기:18, 쓰기:18, 말하기:19 } },
  { studentId: 's9',  classId: 'c1', date: '2026-04-13', type: 'weekly', score: 68, maxScore: 100, testName: '4월 2주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:13, 읽기:14, 쓰기:14, 말하기:13 } },
  { studentId: 's11', classId: 'c1', date: '2026-04-13', type: 'weekly', score: 86, maxScore: 100, testName: '4월 2주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:18, 읽기:17, 쓰기:17, 말하기:17 } },
  { studentId: 's15', classId: 'c1', date: '2026-04-13', type: 'weekly', score: 89, maxScore: 100, testName: '4월 2주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:17, 말하기:18 } },
  // 4월 3주 주간테스트 (4/20)
  { studentId: 's1',  classId: 'c1', date: '2026-04-20', type: 'weekly', score: 92, maxScore: 100, testName: '4월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:19, 읽기:19, 쓰기:18, 말하기:18 } },
  { studentId: 's2',  classId: 'c1', date: '2026-04-20', type: 'weekly', score: 76, maxScore: 100, testName: '4월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:16, 읽기:15, 쓰기:15, 말하기:15 } },
  { studentId: 's6',  classId: 'c1', date: '2026-04-20', type: 'weekly', score: 95, maxScore: 100, testName: '4월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:19, 읽기:19, 쓰기:19, 말하기:19 } },
  { studentId: 's9',  classId: 'c1', date: '2026-04-20', type: 'weekly', score: 71, maxScore: 100, testName: '4월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:14, 읽기:14, 쓰기:15, 말하기:14 } },
  { studentId: 's11', classId: 'c1', date: '2026-04-20', type: 'weekly', score: 88, maxScore: 100, testName: '4월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:17, 쓰기:18, 말하기:17 } },
  { studentId: 's15', classId: 'c1', date: '2026-04-20', type: 'weekly', score: 91, maxScore: 100, testName: '4월 3주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:19, 쓰기:18, 말하기:18 } },
  // 4월 4주 주간테스트 (4/27) — 최신
  { studentId: 's1',  classId: 'c1', date: '2026-04-27', type: 'weekly', score: 94, maxScore: 100, testName: '4월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:19, 읽기:19, 쓰기:18, 말하기:19 } },
  { studentId: 's2',  classId: 'c1', date: '2026-04-27', type: 'weekly', score: 78, maxScore: 100, testName: '4월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:16, 읽기:16, 쓰기:16, 말하기:15 } },
  { studentId: 's6',  classId: 'c1', date: '2026-04-27', type: 'weekly', score: 97, maxScore: 100, testName: '4월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:20, 듣기:19, 읽기:20, 쓰기:19, 말하기:19 } },
  { studentId: 's9',  classId: 'c1', date: '2026-04-27', type: 'weekly', score: 73, maxScore: 100, testName: '4월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:14, 읽기:14, 쓰기:15, 말하기:15 } },
  { studentId: 's11', classId: 'c1', date: '2026-04-27', type: 'weekly', score: 90, maxScore: 100, testName: '4월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:18, 말하기:18 } },
  { studentId: 's15', classId: 'c1', date: '2026-04-27', type: 'weekly', score: 93, maxScore: 100, testName: '4월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:19, 읽기:18, 쓰기:18, 말하기:19 } },
  // 4월 월간평가 (4/25)
  { studentId: 's1',  classId: 'c1', date: '2026-04-25', type: 'monthly', score: 93, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:19, 읽기:18, 쓰기:18, 말하기:19 } },
  { studentId: 's2',  classId: 'c1', date: '2026-04-25', type: 'monthly', score: 77, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:16, 읽기:15, 쓰기:16, 말하기:15 } },
  { studentId: 's6',  classId: 'c1', date: '2026-04-25', type: 'monthly', score: 95, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:19, 읽기:20, 쓰기:18, 말하기:19 } },
  { studentId: 's9',  classId: 'c1', date: '2026-04-25', type: 'monthly', score: 71, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:14, 읽기:14, 쓰기:15, 말하기:14 } },
  { studentId: 's11', classId: 'c1', date: '2026-04-25', type: 'monthly', score: 86, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:18, 쓰기:17, 말하기:17 } },
  { studentId: 's15', classId: 'c1', date: '2026-04-25', type: 'monthly', score: 88, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:17, 쓰기:18, 말하기:17 } },
  // 4월 데일리 추가 (4/21, 4/23, 4/25, 4/28)
  { studentId: 's1',  classId: 'c1', date: '2026-04-21', type: 'daily', score: 93, maxScore: 100, testName: '4/21 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-21', type: 'daily', score: 77, maxScore: 100, testName: '4/21 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-21', type: 'daily', score: 97, maxScore: 100, testName: '4/21 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-21', type: 'daily', score: 72, maxScore: 100, testName: '4/21 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-04-21', type: 'daily', score: 88, maxScore: 100, testName: '4/21 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-04-21', type: 'daily', score: 92, maxScore: 100, testName: '4/21 단어테스트' },
  { studentId: 's1',  classId: 'c1', date: '2026-04-23', type: 'daily', score: 95, maxScore: 100, testName: '4/23 문법퀴즈' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-23', type: 'daily', score: 79, maxScore: 100, testName: '4/23 문법퀴즈' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-23', type: 'daily', score: 98, maxScore: 100, testName: '4/23 문법퀴즈' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-23', type: 'daily', score: 74, maxScore: 100, testName: '4/23 문법퀴즈' },
  { studentId: 's11', classId: 'c1', date: '2026-04-23', type: 'daily', score: 89, maxScore: 100, testName: '4/23 문법퀴즈' },
  { studentId: 's15', classId: 'c1', date: '2026-04-23', type: 'daily', score: 93, maxScore: 100, testName: '4/23 문법퀴즈' },
  { studentId: 's1',  classId: 'c1', date: '2026-04-25', type: 'daily', score: 94, maxScore: 100, testName: '4/25 단어테스트' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-25', type: 'daily', score: 78, maxScore: 100, testName: '4/25 단어테스트' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-25', type: 'daily', score: 99, maxScore: 100, testName: '4/25 단어테스트' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-25', type: 'daily', score: 75, maxScore: 100, testName: '4/25 단어테스트' },
  { studentId: 's11', classId: 'c1', date: '2026-04-25', type: 'daily', score: 90, maxScore: 100, testName: '4/25 단어테스트' },
  { studentId: 's15', classId: 'c1', date: '2026-04-25', type: 'daily', score: 94, maxScore: 100, testName: '4/25 단어테스트' },
  { studentId: 's1',  classId: 'c1', date: '2026-04-28', type: 'daily', score: 96, maxScore: 100, testName: '4/28 문법퀴즈' },
  { studentId: 's2',  classId: 'c1', date: '2026-04-28', type: 'daily', score: 80, maxScore: 100, testName: '4/28 문법퀴즈' },
  { studentId: 's6',  classId: 'c1', date: '2026-04-28', type: 'daily', score: 99, maxScore: 100, testName: '4/28 문법퀴즈' },
  { studentId: 's9',  classId: 'c1', date: '2026-04-28', type: 'daily', score: 76, maxScore: 100, testName: '4/28 문법퀴즈' },
  { studentId: 's11', classId: 'c1', date: '2026-04-28', type: 'daily', score: 91, maxScore: 100, testName: '4/28 문법퀴즈' },
  { studentId: 's15', classId: 'c1', date: '2026-04-28', type: 'daily', score: 95, maxScore: 100, testName: '4/28 문법퀴즈' },

  // ── c2 수학 B반 (화/목 : s3,s4,s12) ──
  // 03-17 (화) 개념테스트 인수분해
  { studentId: 's3',  classId: 'c2', date: '2026-03-17', type: 'daily', score: 82, maxScore: 100, testName: '3/17 개념테스트' },
  { studentId: 's4',  classId: 'c2', date: '2026-03-17', type: 'daily', score: 66, maxScore: 100, testName: '3/17 개념테스트' },
  { studentId: 's12', classId: 'c2', date: '2026-03-17', type: 'daily', score: 53, maxScore: 100, testName: '3/17 개념테스트' },
  // 03-24 (화) 연산테스트 이차방정식
  { studentId: 's3',  classId: 'c2', date: '2026-03-24', type: 'daily', score: 84, maxScore: 100, testName: '3/24 연산테스트' },
  { studentId: 's4',  classId: 'c2', date: '2026-03-24', type: 'daily', score: 68, maxScore: 100, testName: '3/24 연산테스트' },
  { studentId: 's12', classId: 'c2', date: '2026-03-24', type: 'daily', score: 56, maxScore: 100, testName: '3/24 연산테스트' },
  // 03-31 (화) 개념테스트 근의공식
  { studentId: 's3',  classId: 'c2', date: '2026-03-31', type: 'daily', score: 86, maxScore: 100, testName: '3/31 개념테스트' },
  { studentId: 's4',  classId: 'c2', date: '2026-03-31', type: 'daily', score: 70, maxScore: 100, testName: '3/31 개념테스트' },
  { studentId: 's12', classId: 'c2', date: '2026-03-31', type: 'daily', score: 58, maxScore: 100, testName: '3/31 개념테스트' },
  // 04-07 (화) 연산테스트 이차방정식 응용
  { studentId: 's3',  classId: 'c2', date: '2026-04-07', type: 'daily', score: 87, maxScore: 100, testName: '4/7 연산테스트' },
  { studentId: 's4',  classId: 'c2', date: '2026-04-07', type: 'daily', score: 72, maxScore: 100, testName: '4/7 연산테스트' },
  { studentId: 's12', classId: 'c2', date: '2026-04-07', type: 'daily', score: 61, maxScore: 100, testName: '4/7 연산테스트' },
  // 04-09 (목) 개념테스트 이차함수
  { studentId: 's3',  classId: 'c2', date: '2026-04-09', type: 'daily', score: 89, maxScore: 100, testName: '4/9 개념테스트' },
  { studentId: 's4',  classId: 'c2', date: '2026-04-09', type: 'daily', score: 74, maxScore: 100, testName: '4/9 개념테스트' },
  { studentId: 's12', classId: 'c2', date: '2026-04-09', type: 'daily', score: 63, maxScore: 100, testName: '4/9 개념테스트' },
  // 04-14 (화) 연산테스트 이차함수
  { studentId: 's3',  classId: 'c2', date: '2026-04-14', type: 'daily', score: 90, maxScore: 100, testName: '4/14 연산테스트' },
  { studentId: 's4',  classId: 'c2', date: '2026-04-14', type: 'daily', score: 75, maxScore: 100, testName: '4/14 연산테스트' },
  { studentId: 's12', classId: 'c2', date: '2026-04-14', type: 'daily', score: 65, maxScore: 100, testName: '4/14 연산테스트' },
  // 04-16 (목) 개념테스트 5단원 복습
  { studentId: 's3',  classId: 'c2', date: '2026-04-16', type: 'daily', score: 91, maxScore: 100, testName: '4/16 개념테스트' },
  { studentId: 's4',  classId: 'c2', date: '2026-04-16', type: 'daily', score: 77, maxScore: 100, testName: '4/16 개념테스트' },
  { studentId: 's12', classId: 'c2', date: '2026-04-16', type: 'daily', score: 66, maxScore: 100, testName: '4/16 개념테스트' },

  // ── c3 국어 C반 (월/목 : s1,s5,s10,s13) ──
  // 03-19 (목) 어휘테스트 비문학
  { studentId: 's1',  classId: 'c3', date: '2026-03-19', type: 'daily', score: 79, maxScore: 100, testName: '3/19 어휘테스트' },
  { studentId: 's5',  classId: 'c3', date: '2026-03-19', type: 'daily', score: 83, maxScore: 100, testName: '3/19 어휘테스트' },
  { studentId: 's10', classId: 'c3', date: '2026-03-19', type: 'daily', score: 67, maxScore: 100, testName: '3/19 어휘테스트' },
  { studentId: 's13', classId: 'c3', date: '2026-03-19', type: 'daily', score: 72, maxScore: 100, testName: '3/19 어휘테스트' },
  // 03-23 (월) 독해퀴즈 사회지문
  { studentId: 's1',  classId: 'c3', date: '2026-03-23', type: 'daily', score: 81, maxScore: 100, testName: '3/23 독해퀴즈' },
  { studentId: 's5',  classId: 'c3', date: '2026-03-23', type: 'daily', score: 85, maxScore: 100, testName: '3/23 독해퀴즈' },
  { studentId: 's10', classId: 'c3', date: '2026-03-23', type: 'daily', score: 69, maxScore: 100, testName: '3/23 독해퀴즈' },
  { studentId: 's13', classId: 'c3', date: '2026-03-23', type: 'daily', score: 74, maxScore: 100, testName: '3/23 독해퀴즈' },
  // 03-26 (목) 어휘테스트 문학
  { studentId: 's1',  classId: 'c3', date: '2026-03-26', type: 'daily', score: 82, maxScore: 100, testName: '3/26 어휘테스트' },
  { studentId: 's5',  classId: 'c3', date: '2026-03-26', type: 'daily', score: 86, maxScore: 100, testName: '3/26 어휘테스트' },
  { studentId: 's10', classId: 'c3', date: '2026-03-26', type: 'daily', score: 70, maxScore: 100, testName: '3/26 어휘테스트' },
  { studentId: 's13', classId: 'c3', date: '2026-03-26', type: 'daily', score: 75, maxScore: 100, testName: '3/26 어휘테스트' },
  // 04-02 (목) 독해퀴즈 과학지문
  { studentId: 's1',  classId: 'c3', date: '2026-04-02', type: 'daily', score: 83, maxScore: 100, testName: '4/2 독해퀴즈' },
  { studentId: 's5',  classId: 'c3', date: '2026-04-02', type: 'daily', score: 87, maxScore: 100, testName: '4/2 독해퀴즈' },
  { studentId: 's10', classId: 'c3', date: '2026-04-02', type: 'daily', score: 71, maxScore: 100, testName: '4/2 독해퀴즈' },
  { studentId: 's13', classId: 'c3', date: '2026-04-02', type: 'daily', score: 76, maxScore: 100, testName: '4/2 독해퀴즈' },
  // 04-06 (월) 어휘테스트 현대시
  { studentId: 's1',  classId: 'c3', date: '2026-04-06', type: 'daily', score: 84, maxScore: 100, testName: '4/6 어휘테스트' },
  { studentId: 's5',  classId: 'c3', date: '2026-04-06', type: 'daily', score: 88, maxScore: 100, testName: '4/6 어휘테스트' },
  { studentId: 's10', classId: 'c3', date: '2026-04-06', type: 'daily', score: 72, maxScore: 100, testName: '4/6 어휘테스트' },
  { studentId: 's13', classId: 'c3', date: '2026-04-06', type: 'daily', score: 77, maxScore: 100, testName: '4/6 어휘테스트' },
  // 04-09 (목) 독해퀴즈 비문학 전략
  { studentId: 's1',  classId: 'c3', date: '2026-04-09', type: 'daily', score: 85, maxScore: 100, testName: '4/9 독해퀴즈' },
  { studentId: 's5',  classId: 'c3', date: '2026-04-09', type: 'daily', score: 89, maxScore: 100, testName: '4/9 독해퀴즈' },
  { studentId: 's10', classId: 'c3', date: '2026-04-09', type: 'daily', score: 74, maxScore: 100, testName: '4/9 독해퀴즈' },
  { studentId: 's13', classId: 'c3', date: '2026-04-09', type: 'daily', score: 79, maxScore: 100, testName: '4/9 독해퀴즈' },
  // 04-13 (월) 어휘테스트 현대소설
  { studentId: 's1',  classId: 'c3', date: '2026-04-13', type: 'daily', score: 86, maxScore: 100, testName: '4/13 어휘테스트' },
  { studentId: 's5',  classId: 'c3', date: '2026-04-13', type: 'daily', score: 90, maxScore: 100, testName: '4/13 어휘테스트' },
  { studentId: 's10', classId: 'c3', date: '2026-04-13', type: 'daily', score: 75, maxScore: 100, testName: '4/13 어휘테스트' },
  { studentId: 's13', classId: 'c3', date: '2026-04-13', type: 'daily', score: 80, maxScore: 100, testName: '4/13 어휘테스트' },
  // 04-16 (목) 독해퀴즈 고전문학
  { studentId: 's1',  classId: 'c3', date: '2026-04-16', type: 'daily', score: 87, maxScore: 100, testName: '4/16 독해퀴즈' },
  { studentId: 's5',  classId: 'c3', date: '2026-04-16', type: 'daily', score: 91, maxScore: 100, testName: '4/16 독해퀴즈' },
  { studentId: 's10', classId: 'c3', date: '2026-04-16', type: 'daily', score: 76, maxScore: 100, testName: '4/16 독해퀴즈' },
  { studentId: 's13', classId: 'c3', date: '2026-04-16', type: 'daily', score: 81, maxScore: 100, testName: '4/16 독해퀴즈' },

  // ── c4 수학 D반 (화/금 : s6,s15) ──
  // 03-20 (금) 개념테스트 일차함수
  { studentId: 's6',  classId: 'c4', date: '2026-03-20', type: 'daily', score: 84, maxScore: 100, testName: '3/20 개념테스트' },
  { studentId: 's15', classId: 'c4', date: '2026-03-20', type: 'daily', score: 77, maxScore: 100, testName: '3/20 개념테스트' },
  // 03-27 (금) 연산테스트 일차함수 응용
  { studentId: 's6',  classId: 'c4', date: '2026-03-27', type: 'daily', score: 86, maxScore: 100, testName: '3/27 연산테스트' },
  { studentId: 's15', classId: 'c4', date: '2026-03-27', type: 'daily', score: 79, maxScore: 100, testName: '3/27 연산테스트' },
  // 04-03 (금) 개념테스트 이차방정식 입문
  { studentId: 's6',  classId: 'c4', date: '2026-04-03', type: 'daily', score: 88, maxScore: 100, testName: '4/3 개념테스트' },
  { studentId: 's15', classId: 'c4', date: '2026-04-03', type: 'daily', score: 81, maxScore: 100, testName: '4/3 개념테스트' },
  // 04-07 (화) 연산테스트 이차방정식
  { studentId: 's6',  classId: 'c4', date: '2026-04-07', type: 'daily', score: 89, maxScore: 100, testName: '4/7 연산테스트' },
  { studentId: 's15', classId: 'c4', date: '2026-04-07', type: 'daily', score: 83, maxScore: 100, testName: '4/7 연산테스트' },
  // 04-10 (금) 개념테스트 근의공식
  { studentId: 's6',  classId: 'c4', date: '2026-04-10', type: 'daily', score: 91, maxScore: 100, testName: '4/10 개념테스트' },
  { studentId: 's15', classId: 'c4', date: '2026-04-10', type: 'daily', score: 85, maxScore: 100, testName: '4/10 개념테스트' },
  // 04-14 (화) 연산테스트 근의공식 응용
  { studentId: 's6',  classId: 'c4', date: '2026-04-14', type: 'daily', score: 92, maxScore: 100, testName: '4/14 연산테스트' },
  { studentId: 's15', classId: 'c4', date: '2026-04-14', type: 'daily', score: 86, maxScore: 100, testName: '4/14 연산테스트' },
  // 04-17 (금) 개념테스트 4단원 복습
  { studentId: 's6',  classId: 'c4', date: '2026-04-17', type: 'daily', score: 93, maxScore: 100, testName: '4/17 개념테스트' },
  { studentId: 's15', classId: 'c4', date: '2026-04-17', type: 'daily', score: 88, maxScore: 100, testName: '4/17 개념테스트' },

  // ── 성적표용 월간평가 데이터 ───────────────────────────────────────────────
  // c1 영어 A반 — 4월 월간평가
  { studentId: 's1',  classId: 'c1', date: '2026-04-30', type: 'monthly', score: 93, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:18, 읽기:19, 쓰기:18, 말하기:19 } },
  { studentId: 's2',  classId: 'c1', date: '2026-04-30', type: 'monthly', score: 76, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:15, 읽기:16, 쓰기:15, 말하기:15 } },
  { studentId: 's6',  classId: 'c1', date: '2026-04-30', type: 'monthly', score: 94, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:19, 듣기:19, 읽기:19, 쓰기:19, 말하기:18 } },
  { studentId: 's9',  classId: 'c1', date: '2026-04-30', type: 'monthly', score: 71, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:14, 읽기:15, 쓰기:14, 말하기:14 } },
  { studentId: 's11', classId: 'c1', date: '2026-04-30', type: 'monthly', score: 87, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:18, 읽기:18, 쓰기:17, 말하기:17 } },
  { studentId: 's15', classId: 'c1', date: '2026-04-30', type: 'monthly', score: 89, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:17, 말하기:18 } },

  // c2 수학 B반 — 월간평가 (1월, 3월, 4월)
  { studentId: 's3',  classId: 'c2', date: '2026-01-29', type: 'monthly', score: 82, maxScore: 100, testName: '1월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:21, 연산:21, 응용:20, 서술:20 } },
  { studentId: 's4',  classId: 'c2', date: '2026-01-29', type: 'monthly', score: 75, maxScore: 100, testName: '1월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:19, 연산:19, 응용:19, 서술:18 } },
  { studentId: 's12', classId: 'c2', date: '2026-01-29', type: 'monthly', score: 61, maxScore: 100, testName: '1월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:16, 연산:15, 응용:15, 서술:15 } },
  { studentId: 's3',  classId: 'c2', date: '2026-02-26', type: 'monthly', score: 85, maxScore: 100, testName: '2월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:22, 연산:21, 응용:21, 서술:21 } },
  { studentId: 's4',  classId: 'c2', date: '2026-02-26', type: 'monthly', score: 77, maxScore: 100, testName: '2월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:20, 연산:19, 응용:19, 서술:19 } },
  { studentId: 's12', classId: 'c2', date: '2026-02-26', type: 'monthly', score: 64, maxScore: 100, testName: '2월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:16, 연산:16, 응용:16, 서술:16 } },
  { studentId: 's3',  classId: 'c2', date: '2026-03-28', type: 'monthly', score: 88, maxScore: 100, testName: '3월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:22, 연산:22, 응용:22, 서술:22 } },
  { studentId: 's4',  classId: 'c2', date: '2026-03-28', type: 'monthly', score: 79, maxScore: 100, testName: '3월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:20, 연산:20, 응용:20, 서술:19 } },
  { studentId: 's12', classId: 'c2', date: '2026-03-28', type: 'monthly', score: 67, maxScore: 100, testName: '3월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:17, 연산:17, 응용:17, 서술:16 } },
  { studentId: 's3',  classId: 'c2', date: '2026-04-30', type: 'monthly', score: 91, maxScore: 100, testName: '4월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:23, 연산:23, 응용:23, 서술:22 } },
  { studentId: 's4',  classId: 'c2', date: '2026-04-30', type: 'monthly', score: 81, maxScore: 100, testName: '4월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:21, 연산:20, 응용:20, 서술:20 } },
  { studentId: 's12', classId: 'c2', date: '2026-04-30', type: 'monthly', score: 69, maxScore: 100, testName: '4월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:18, 연산:17, 응용:17, 서술:17 } },

  // c3 국어 C반 — 월간평가 (1월, 2월, 3월, 4월)
  { studentId: 's1',  classId: 'c3', date: '2026-01-29', type: 'monthly', score: 79, maxScore: 100, testName: '1월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:20, 독해:20, 문학:20, 쓰기:19 } },
  { studentId: 's5',  classId: 'c3', date: '2026-01-29', type: 'monthly', score: 84, maxScore: 100, testName: '1월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:21, 독해:21, 문학:21, 쓰기:21 } },
  { studentId: 's10', classId: 'c3', date: '2026-01-29', type: 'monthly', score: 68, maxScore: 100, testName: '1월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:17, 독해:17, 문학:17, 쓰기:17 } },
  { studentId: 's13', classId: 'c3', date: '2026-01-29', type: 'monthly', score: 73, maxScore: 100, testName: '1월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:18, 독해:19, 문학:18, 쓰기:18 } },
  { studentId: 's1',  classId: 'c3', date: '2026-02-26', type: 'monthly', score: 81, maxScore: 100, testName: '2월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:20, 독해:21, 문학:20, 쓰기:20 } },
  { studentId: 's5',  classId: 'c3', date: '2026-02-26', type: 'monthly', score: 86, maxScore: 100, testName: '2월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:22, 독해:21, 문학:22, 쓰기:21 } },
  { studentId: 's10', classId: 'c3', date: '2026-02-26', type: 'monthly', score: 70, maxScore: 100, testName: '2월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:18, 독해:17, 문학:18, 쓰기:17 } },
  { studentId: 's13', classId: 'c3', date: '2026-02-26', type: 'monthly', score: 76, maxScore: 100, testName: '2월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:19, 독해:19, 문학:19, 쓰기:19 } },
  { studentId: 's1',  classId: 'c3', date: '2026-03-30', type: 'monthly', score: 83, maxScore: 100, testName: '3월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:21, 독해:21, 문학:21, 쓰기:20 } },
  { studentId: 's5',  classId: 'c3', date: '2026-03-30', type: 'monthly', score: 88, maxScore: 100, testName: '3월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:22, 독해:22, 문학:22, 쓰기:22 } },
  { studentId: 's10', classId: 'c3', date: '2026-03-30', type: 'monthly', score: 72, maxScore: 100, testName: '3월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:18, 독해:18, 문학:18, 쓰기:18 } },
  { studentId: 's13', classId: 'c3', date: '2026-03-30', type: 'monthly', score: 78, maxScore: 100, testName: '3월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:20, 독해:20, 문학:19, 쓰기:19 } },
  { studentId: 's1',  classId: 'c3', date: '2026-04-30', type: 'monthly', score: 85, maxScore: 100, testName: '4월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:21, 독해:22, 문학:21, 쓰기:21 } },
  { studentId: 's5',  classId: 'c3', date: '2026-04-30', type: 'monthly', score: 90, maxScore: 100, testName: '4월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:23, 독해:23, 문학:22, 쓰기:22 } },
  { studentId: 's10', classId: 'c3', date: '2026-04-30', type: 'monthly', score: 74, maxScore: 100, testName: '4월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:19, 독해:18, 문학:19, 쓰기:18 } },
  { studentId: 's13', classId: 'c3', date: '2026-04-30', type: 'monthly', score: 80, maxScore: 100, testName: '4월 월간평가', fields: ['어휘','독해','문학','쓰기'], subScores: { 어휘:20, 독해:20, 문학:20, 쓰기:20 } },

  // ── 테스트 선생님 반 성적 ────────────────────────────────────────────────
  // c_t1 영어반 — 2026-03
  { studentId: 's_t1', classId: 'c_t1', date: '2026-03-11', type: 'daily', score: 88, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-03-11', type: 'daily', score: 72, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-03-11', type: 'daily', score: 80, maxScore: 100, testName: '3/11 단어테스트' },
  { studentId: 's_t1', classId: 'c_t1', date: '2026-03-20', type: 'daily', score: 90, maxScore: 100, testName: '3/20 문법퀴즈' },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-03-20', type: 'daily', score: 74, maxScore: 100, testName: '3/20 문법퀴즈' },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-03-20', type: 'daily', score: 82, maxScore: 100, testName: '3/20 문법퀴즈' },
  { studentId: 's_t1', classId: 'c_t1', date: '2026-03-27', type: 'weekly', score: 86, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:17, 읽기:18, 쓰기:17, 말하기:17 } },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-03-27', type: 'weekly', score: 71, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:14, 읽기:15, 쓰기:14, 말하기:14 } },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-03-27', type: 'weekly', score: 79, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:15, 읽기:16, 쓰기:16, 말하기:16 } },
  // c_t1 — 2026-04
  { studentId: 's_t1', classId: 'c_t1', date: '2026-04-06', type: 'daily', score: 91, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-04-06', type: 'daily', score: 75, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-04-06', type: 'daily', score: 83, maxScore: 100, testName: '4/6 단어테스트' },
  { studentId: 's_t1', classId: 'c_t1', date: '2026-04-13', type: 'daily', score: 93, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-04-13', type: 'daily', score: 78, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-04-13', type: 'daily', score: 85, maxScore: 100, testName: '4/13 문법퀴즈' },
  { studentId: 's_t1', classId: 'c_t1', date: '2026-04-17', type: 'weekly', score: 90, maxScore: 100, testName: '4월 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:18, 쓰기:18, 말하기:18 } },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-04-17', type: 'weekly', score: 74, maxScore: 100, testName: '4월 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:14, 읽기:15, 쓰기:15, 말하기:15 } },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-04-17', type: 'weekly', score: 82, maxScore: 100, testName: '4월 주간테스트', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:17, 쓰기:17, 말하기:16 } },
  // c_t2 수학반 — 2026-03~04
  { studentId: 's_t1', classId: 'c_t2', date: '2026-03-12', type: 'daily', score: 82, maxScore: 100, testName: '3/12 계산테스트' },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-03-12', type: 'daily', score: 68, maxScore: 100, testName: '3/12 계산테스트' },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-03-19', type: 'daily', score: 85, maxScore: 100, testName: '3/19 개념테스트' },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-03-19', type: 'daily', score: 70, maxScore: 100, testName: '3/19 개념테스트' },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-03-26', type: 'weekly', score: 81, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['개념','연산','응용','서술'], subScores: { 개념:21, 연산:20, 응용:20, 서술:20 } },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-03-26', type: 'weekly', score: 66, maxScore: 100, testName: '3월 4주 주간테스트', fields: ['개념','연산','응용','서술'], subScores: { 개념:17, 연산:17, 응용:16, 서술:16 } },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-04-09', type: 'daily', score: 87, maxScore: 100, testName: '4/9 개념테스트' },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-04-09', type: 'daily', score: 73, maxScore: 100, testName: '4/9 개념테스트' },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-04-16', type: 'weekly', score: 85, maxScore: 100, testName: '4월 주간테스트', fields: ['개념','연산','응용','서술'], subScores: { 개념:21, 연산:22, 응용:21, 서술:21 } },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-04-16', type: 'weekly', score: 71, maxScore: 100, testName: '4월 주간테스트', fields: ['개념','연산','응용','서술'], subScores: { 개념:18, 연산:18, 응용:18, 서술:17 } },
  // 테스트 반 월간평가
  { studentId: 's_t1', classId: 'c_t1', date: '2026-03-31', type: 'monthly', score: 87, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:18, 읽기:18, 쓰기:17, 말하기:17 } },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-03-31', type: 'monthly', score: 72, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:14, 듣기:15, 읽기:15, 쓰기:14, 말하기:14 } },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-03-31', type: 'monthly', score: 80, maxScore: 100, testName: '3월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:16, 듣기:16, 읽기:16, 쓰기:16, 말하기:16 } },
  { studentId: 's_t1', classId: 'c_t1', date: '2026-04-30', type: 'monthly', score: 91, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:18, 듣기:18, 읽기:19, 쓰기:18, 말하기:18 } },
  { studentId: 's_t2', classId: 'c_t1', date: '2026-04-30', type: 'monthly', score: 75, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:15, 듣기:15, 읽기:15, 쓰기:15, 말하기:15 } },
  { studentId: 's_t3', classId: 'c_t1', date: '2026-04-30', type: 'monthly', score: 83, maxScore: 100, testName: '4월 월간평가', fields: ['단어','듣기','읽기','쓰기','말하기'], subScores: { 단어:17, 듣기:16, 읽기:17, 쓰기:17, 말하기:16 } },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-03-31', type: 'monthly', score: 83, maxScore: 100, testName: '3월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:21, 연산:21, 응용:21, 서술:20 } },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-03-31', type: 'monthly', score: 67, maxScore: 100, testName: '3월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:17, 연산:17, 응용:17, 서술:16 } },
  { studentId: 's_t1', classId: 'c_t2', date: '2026-04-30', type: 'monthly', score: 86, maxScore: 100, testName: '4월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:22, 연산:22, 응용:21, 서술:21 } },
  { studentId: 's_t4', classId: 'c_t2', date: '2026-04-30', type: 'monthly', score: 72, maxScore: 100, testName: '4월 월간평가', fields: ['개념','연산','응용','서술'], subScores: { 개념:18, 연산:18, 응용:18, 서술:18 } },
];

// ─── SCHEDULE EVENTS ──────────────────────────────────────────
export const mockScheduleEvents: ScheduleEvent[] = [
  { id: 'e1', title: '신규 입학 상담',         date: '2026-04-16', startTime: '14:00', endTime: '14:30', type: 'consultation', personName: '김학부모', personType: '학부모', content: '중2 자녀 수학 입학 상담',          phone: '010-1234-0001' },
  { id: 'e2', title: '교재 납품 미팅',         date: '2026-04-17', startTime: '10:00', endTime: '11:00', type: 'external',     personName: '민교재 담당자', personType: '외부업체', content: '2분기 교재 납품 계약 논의',    phone: '010-9876-5432' },
  { id: 'e3', title: '강사 월례 회의',         date: '2026-04-17', startTime: '13:00', endTime: '14:00', type: 'meeting',      personName: '전 강사',   personType: '강사',   content: '4월 교육 방향 논의 및 학생 피드백 공유' },
  { id: 'e4', title: '학부모 상담 - 박지호',   date: '2026-04-18', startTime: '15:00', endTime: '15:30', type: 'consultation', personName: '박학부모',  personType: '학부모', content: '박지호 학생 수학 성적 향상 방안',        phone: '010-3333-4444' },
  { id: 'e5', title: '영어 특강 설명회',       date: '2026-04-25', startTime: '19:00', endTime: '21:00', type: 'event',        personName: '이수진 강사', personType: '강사', content: '중1~2 대상 영어 특강 프로그램 설명회' },
  { id: 'e6',  title: '수학경시대회 준비 설명회', date: '2026-05-03', startTime: '14:00', endTime: '16:00', type: 'event',        personName: '박민호 강사',    personType: '강사',    content: '수학 경시대회 참가 학생 모집 및 준비' },
  { id: 'e7',  title: '냉난방 점검',             date: '2026-04-22', startTime: '09:00', endTime: '10:30', type: 'external',     personName: 'A/S 업체',       personType: '외부업체', content: '여름철 에어컨 사전 점검',                          phone: '010-0000-5555' },
  { id: 'e8',  title: '학부모 상담 - 강수아',    date: '2026-04-21', startTime: '16:00', endTime: '16:30', type: 'consultation', personName: '강학부모',        personType: '학부모',  content: '강수아 학생 영어+수학 병행 학습 방향',             phone: '010-6666-7777' },
  { id: 'e9',  title: '학부모 상담 - 이서연',    date: '2026-04-23', startTime: '17:00', endTime: '17:30', type: 'consultation', personName: '이학부모',        personType: '학부모',  content: '이서연 학생 영어 성적 개선 상담',                  phone: '010-2222-3333' },
  // ── 5월 더미 일정 ──────────────────────────────────────────────
  { id: 'e10', title: '어린이날 보강 계획 회의', date: '2026-05-02', startTime: '10:00', endTime: '11:00', type: 'meeting',      personName: '전 강사',         personType: '강사',    content: '어린이날 휴원에 따른 보강 일정 및 수업 분배 논의' },
  { id: 'e11', title: '중간고사 대비 특강 안내', date: '2026-05-06', startTime: '19:00', endTime: '20:30', type: 'event',        personName: '이수진 강사',     personType: '강사',    content: '중1~3 대상 중간고사 집중 대비 특강 일정 안내' },
  { id: 'e12', title: '학부모 상담 - 김민준',   date: '2026-05-07', startTime: '15:00', endTime: '15:30', type: 'consultation', personName: '김학부모',        personType: '학부모',  content: '김민준 학생 수학 심화 과정 전환 상담',             phone: '010-1111-2222' },
  { id: 'e13', title: '교재 출판사 미팅',        date: '2026-05-08', startTime: '10:30', endTime: '11:30', type: 'external',     personName: '비상교육 담당자', personType: '외부업체', content: '2학기 교재 선정 및 샘플 검토',                     phone: '010-8765-4321' },
  { id: 'e14', title: '강사 개별 면담 - 이수진', date: '2026-05-09', startTime: '13:00', endTime: '13:30', type: 'meeting',      personName: '이수진 강사',     personType: '강사',    content: '수업 방향성 및 학생 관리 방식 점검' },
  { id: 'e15', title: '학부모 상담 - 노지민',   date: '2026-05-12', startTime: '16:00', endTime: '16:30', type: 'consultation', personName: '노학부모',        personType: '학부모',  content: '노지민 학생 국어 독해 집중 보완 방안',             phone: '010-5555-6666' },
  { id: 'e16', title: '중간고사 집중 특강 (1일차)', date: '2026-05-13', startTime: '09:00', endTime: '12:00', type: 'event',    personName: '전 강사',         personType: '강사',    content: '중간고사 전날 국어·영어·수학 집중 특강' },
  { id: 'e17', title: '스승의 날 행사',          date: '2026-05-15', startTime: '17:00', endTime: '18:00', type: 'event',        personName: '전체',            personType: '강사',    content: '학생 대표 감사 편지 및 소규모 기념 행사' },
  { id: 'e18', title: '강사 월례 회의',          date: '2026-05-16', startTime: '13:00', endTime: '14:30', type: 'meeting',      personName: '전 강사',         personType: '강사',    content: '5월 교육 운영 점검, 중간고사 결과 분석, 6월 계획 수립' },
  { id: 'e19', title: '학부모 상담 - 조민서',   date: '2026-05-19', startTime: '17:30', endTime: '18:00', type: 'consultation', personName: '조학부모',        personType: '학부모',  content: '조민서 학생 쓰기·말하기 집중 개선 상담',           phone: '010-7777-8888' },
  { id: 'e20', title: '중간고사 결과 분석 회의', date: '2026-05-20', startTime: '14:00', endTime: '15:00', type: 'meeting',      personName: '전 강사',         personType: '강사',    content: '반별 중간고사 성적 분석 및 취약 학생 지도 방안 논의' },
  { id: 'e21', title: 'CCTV·소방 시설 점검',   date: '2026-05-21', startTime: '09:00', endTime: '10:00', type: 'external',     personName: '시설관리 업체',   personType: '외부업체', content: '분기별 CCTV 및 소방 설비 정기 점검',               phone: '010-3333-9999' },
  { id: 'e22', title: '학부모 상담 - 오승준',   date: '2026-05-22', startTime: '15:30', endTime: '16:00', type: 'consultation', personName: '오학부모',        personType: '학부모',  content: '오승준 학생 학습 태도 및 성적 향상 방안 논의',     phone: '010-4444-5555' },
  { id: 'e23', title: '여름 특강 커리큘럼 회의', date: '2026-05-23', startTime: '11:00', endTime: '12:00', type: 'meeting',      personName: '박민호 강사',     personType: '강사',    content: '7~8월 여름 집중 특강 프로그램 기획 및 과목 구성' },
  { id: 'e24', title: '여름방학 특강 설명회',   date: '2026-05-26', startTime: '19:00', endTime: '21:00', type: 'event',        personName: '이수진 강사',     personType: '강사',    content: '중1~3 학부모 대상 여름방학 집중 특강 모집 설명회' },
  { id: 'e25', title: '학부모 상담 - 박지호',   date: '2026-05-27', startTime: '16:00', endTime: '16:30', type: 'consultation', personName: '박학부모',        personType: '학부모',  content: '박지호 학생 수학 단원 보충 및 여름 특강 신청 논의', phone: '010-2345-6789' },
  { id: 'e26', title: '학원 청소 및 환경 정비', date: '2026-05-28', startTime: '09:00', endTime: '11:00', type: 'external',     personName: '청소 업체',       personType: '외부업체', content: '월말 정기 대청소 및 교실 환경 점검',               phone: '010-6543-2100' },
  { id: 'e27', title: '6월 커리큘럼 기획 회의', date: '2026-05-29', startTime: '13:00', endTime: '14:00', type: 'meeting',      personName: '전 강사',         personType: '강사',    content: '6월 수업 계획, 기말고사 대비 일정 및 과제 방향 수립' },
  { id: 'e28', title: '신규 입학 상담 - 한지원', date: '2026-05-30', startTime: '15:00', endTime: '15:30', type: 'consultation', personName: '한학부모',        personType: '학부모',  content: '중2 신규 학생 영어·수학 동시 수강 희망, 레벨 테스트 예약', phone: '010-9988-7766' },
];

// ─── CONSULTATIONS ────────────────────────────────────────────
export const mockConsultations: ConsultationRecord[] = [
  { id: 'con1',  studentName: '김지성', parentName: '김학부모', phone: '010-1001-2001', date: '2026-02-03', result: 'registered', contactForEvents: true,  source: '지인 추천',   notes: '중1 영어 집중 원함. 현재 학교 성적 중위권. 3월 등록 확정.' },
  { id: 'con2',  studentName: '이나래', parentName: '이학부모', phone: '010-2002-3002', date: '2026-02-10', result: 'registered', contactForEvents: true,  source: '인터넷 검색', notes: '수학 기초 부족 호소. 소수 정예 수업 방식에 만족. 즉시 등록.' },
  { id: 'con3',  studentName: '박준서', parentName: '박학부모', phone: '010-3003-4003', date: '2026-02-15', result: 'declined',   contactForEvents: false, source: '현수막',      notes: '시간대 조율 실패(화·목 18시 불가). 타 학원 등록 예정.' },
  { id: 'con4',  studentName: '최하은', parentName: '최학부모', phone: '010-4004-5004', date: '2026-02-20', result: 'registered', contactForEvents: true,  source: '인스타그램',  notes: '인스타 광고 통해 방문. 국어·영어 동시 수강 희망. 바로 등록.' },
  { id: 'con5',  studentName: '정민재', parentName: '정학부모', phone: '010-5005-6005', date: '2026-02-24', result: 'declined',   contactForEvents: false, source: '지인 추천',   notes: '수강료 부담 언급. 형제 할인 문의했으나 미등록으로 종료.' },
  { id: 'con6',  studentName: '강소현', parentName: '강학부모', phone: '010-6006-7006', date: '2026-03-04', result: 'registered', contactForEvents: true,  source: '인스타그램',  notes: '봄학기 맞춰 등록. 수학 심화 과정 원함. 레벨 테스트 후 B반 배정.' },
  { id: 'con7',  studentName: '윤태양', parentName: '윤학부모', phone: '010-7007-8007', date: '2026-03-08', result: 'pending',    contactForEvents: true,  source: '인터넷 검색', notes: '학교 시험 일정 이후 등록 고려 중. 4월 중 재연락 예정.' },
  { id: 'con8',  studentName: '한주원', parentName: '한학부모', phone: '010-8008-9008', date: '2026-03-12', result: 'registered', contactForEvents: true,  source: '지인 추천',   notes: '지인(오승준 학생 학부모) 소개. 중3 국어 집중. 당일 등록.' },
  { id: 'con9',  studentName: '오지후', parentName: '오학부모', phone: '010-9009-0009', date: '2026-03-18', result: 'declined',   contactForEvents: false, source: '현수막',      notes: '학원까지 거리 문제로 미등록. 온라인 수업 문의했으나 미운영.' },
  { id: 'con10', studentName: '임하린', parentName: '임학부모', phone: '010-0010-1010', date: '2026-03-25', result: 'registered', contactForEvents: true,  source: '인스타그램',  notes: '중2 수학 과외에서 전환. 그룹 수업 적응 위해 체험 수업 후 등록.' },
  { id: 'con11', studentName: '노승찬', parentName: '노학부모', phone: '010-1011-2011', date: '2026-04-01', result: 'registered', contactForEvents: true,  source: '지인 추천',   notes: '중1 신입생. 영어·수학 병행 희망. A반·D반 동시 등록.' },
  { id: 'con12', studentName: '백다은', parentName: '백학부모', phone: '010-2012-3012', date: '2026-04-03', result: 'pending',    contactForEvents: true,  source: '인터넷 검색', notes: '부모 직장 변경으로 픽업 시간 조율 중. 결정 보류.' },
  { id: 'con13', studentName: '서준혁', parentName: '서학부모', phone: '010-3013-4013', date: '2026-04-08', result: 'declined',   contactForEvents: false, source: '현수막',      notes: '현재 다니는 학원 계속 다닐 예정. 비교 상담 목적 방문.' },
  { id: 'con14', studentName: '안지유', parentName: '안학부모', phone: '010-4014-5014', date: '2026-04-10', result: 'registered', contactForEvents: true,  source: '지인 추천',   notes: '노지민 학생 학부모 소개. 국어 약점 개선 목적. C반 등록.' },
  { id: 'con15', studentName: '조현서', parentName: '조학부모', phone: '010-5015-6015', date: '2026-04-14', result: 'pending',    contactForEvents: true,  source: '인스타그램',  notes: '중간고사 이후 결정 예정. 5월 초 재연락 요청.' },
  // ── 4월 추가 상담 (등록전환율 더미) ──────────────────────────────────
  { id: 'con16', studentName: '황민서', parentName: '황학부모', phone: '010-6016-7016', date: '2026-04-15', result: 'registered', contactForEvents: true,  source: '인스타그램',  notes: '인스타 릴스 광고 보고 방문. 중2 수학 집중 원함. 당일 B반 등록.' },
  { id: 'con17', studentName: '전도윤', parentName: '전학부모', phone: '010-7017-8017', date: '2026-04-17', result: 'declined',   contactForEvents: false, source: '현수막',      notes: '자녀 스케줄 과부하로 미등록. 방과후 수업과 겹침 문제.' },
  { id: 'con18', studentName: '석지호', parentName: '석학부모', phone: '010-8018-9018', date: '2026-04-19', result: 'registered', contactForEvents: true,  source: '지인 추천',   notes: '한주원 학생 부모 소개. 중3 국어·영어 병행. 즉시 C반 등록.' },
  { id: 'con19', studentName: '소하늘', parentName: '소학부모', phone: '010-9019-0019', date: '2026-04-22', result: 'pending',    contactForEvents: true,  source: '인터넷 검색', notes: '블로그 후기 보고 내방. 중1 영어 관심. 체험 수업 예약 후 결정 예정.' },
  { id: 'con20', studentName: '탁지원', parentName: '탁학부모', phone: '010-0020-1020', date: '2026-04-24', result: 'declined',   contactForEvents: false, source: '현수막',      notes: '거리 문제로 미등록. 가까운 다른 학원 알아보는 중.' },
  { id: 'con21', studentName: '편수현', parentName: '편학부모', phone: '010-1021-2021', date: '2026-04-26', result: 'registered', contactForEvents: true,  source: '인스타그램',  notes: '인스타 팔로워 통해 DM 상담 후 방문. 중2 수학 D반 등록.' },
  { id: 'con22', studentName: '하윤성', parentName: '하학부모', phone: '010-2022-3022', date: '2026-04-28', result: 'pending',    contactForEvents: true,  source: '지인 추천',   notes: '중1 영어 신규 문의. 5월 초 레벨 테스트 예약 완료. 결과 후 결정.' },
  { id: 'con23', studentName: '함소율', parentName: '함학부모', phone: '010-3023-4023', date: '2026-04-29', result: 'registered', contactForEvents: true,  source: '인터넷 검색', notes: '네이버 학원 검색 후 전화 문의. 중3 영어 집중. 당일 A반 등록.' },
];

// ─── FINANCIALS (~20M income/month) ───────────────────────────
export const mockFinancials: FinancialRecord[] = [
  // ── 2026-01 ──
  { id: 'f101', type: 'income',           category: '수강료',     amount: 19200000, date: '2026-01-05', description: '1월 수강료 합계 (68명)' },
  { id: 'f102', type: 'income',           category: '교재/교구',  amount: 780000,   date: '2026-01-06', description: '1월 교재 판매 수입' },
  { id: 'f103', type: 'income',           category: '특강 수입',  amount: 600000,   date: '2026-01-10', description: '겨울방학 특강' },
  { id: 'f104', type: 'fixed_expense',    category: '임대료',     amount: 2200000,  date: '2026-01-01', description: '1월 학원 임대료' },
  { id: 'f105', type: 'fixed_expense',    category: '강사 급여',  amount: 8700000,  date: '2026-01-25', description: '1월 강사 급여 합계 (3명)' },
  { id: 'f106', type: 'fixed_expense',    category: '스탭 급여',  amount: 2800000,  date: '2026-01-25', description: '1월 스탭 급여' },
  { id: 'f107', type: 'fixed_expense',    category: '인터넷/전화',amount: 180000,   date: '2026-01-05', description: '통신 요금' },
  { id: 'f108', type: 'fixed_expense',    category: '보험료',     amount: 150000,   date: '2026-01-01', description: '시설 보험료' },
  { id: 'f109', type: 'variable_expense', category: '교재비',     amount: 680000,   date: '2026-01-03', description: '1월 교재 구입' },
  { id: 'f110', type: 'variable_expense', category: '공과금',     amount: 420000,   date: '2026-01-15', description: '전기·수도 요금' },
  { id: 'f111', type: 'variable_expense', category: '마케팅',     amount: 250000,   date: '2026-01-10', description: '1월 SNS 광고' },
  { id: 'f112', type: 'variable_expense', category: '소모품',     amount: 95000,    date: '2026-01-08', description: '학원 소모품' },

  // ── 2026-02 ──
  { id: 'f201', type: 'income',           category: '수강료',     amount: 18900000, date: '2026-02-05', description: '2월 수강료 합계 (67명)' },
  { id: 'f202', type: 'income',           category: '교재/교구',  amount: 650000,   date: '2026-02-06', description: '2월 교재 판매 수입' },
  { id: 'f203', type: 'income',           category: '기타 수입',  amount: 300000,   date: '2026-02-14', description: '자료집 판매' },
  { id: 'f204', type: 'fixed_expense',    category: '임대료',     amount: 2200000,  date: '2026-02-01', description: '2월 학원 임대료' },
  { id: 'f205', type: 'fixed_expense',    category: '강사 급여',  amount: 8700000,  date: '2026-02-25', description: '2월 강사 급여 합계' },
  { id: 'f206', type: 'fixed_expense',    category: '스탭 급여',  amount: 2800000,  date: '2026-02-25', description: '2월 스탭 급여' },
  { id: 'f207', type: 'fixed_expense',    category: '인터넷/전화',amount: 180000,   date: '2026-02-05', description: '통신 요금' },
  { id: 'f208', type: 'fixed_expense',    category: '보험료',     amount: 150000,   date: '2026-02-01', description: '시설 보험료' },
  { id: 'f209', type: 'variable_expense', category: '교재비',     amount: 520000,   date: '2026-02-03', description: '2월 교재 구입' },
  { id: 'f210', type: 'variable_expense', category: '공과금',     amount: 390000,   date: '2026-02-15', description: '전기·수도 요금' },
  { id: 'f211', type: 'variable_expense', category: '마케팅',     amount: 350000,   date: '2026-02-10', description: '2월 SNS 광고' },
  { id: 'f212', type: 'variable_expense', category: '소모품',     amount: 80000,    date: '2026-02-07', description: '학원 소모품' },

  // ── 2026-03 ──
  { id: 'f301', type: 'income',           category: '수강료',     amount: 20100000, date: '2026-03-05', description: '3월 수강료 합계 (71명)' },
  { id: 'f302', type: 'income',           category: '교재/교구',  amount: 890000,   date: '2026-03-06', description: '3월 교재 판매 수입' },
  { id: 'f303', type: 'income',           category: '특강 수입',  amount: 800000,   date: '2026-03-15', description: '봄학기 특강' },
  { id: 'f304', type: 'fixed_expense',    category: '임대료',     amount: 2200000,  date: '2026-03-01', description: '3월 학원 임대료' },
  { id: 'f305', type: 'fixed_expense',    category: '강사 급여',  amount: 8700000,  date: '2026-03-25', description: '3월 강사 급여 합계' },
  { id: 'f306', type: 'fixed_expense',    category: '스탭 급여',  amount: 2800000,  date: '2026-03-25', description: '3월 스탭 급여' },
  { id: 'f307', type: 'fixed_expense',    category: '인터넷/전화',amount: 180000,   date: '2026-03-05', description: '통신 요금' },
  { id: 'f308', type: 'fixed_expense',    category: '보험료',     amount: 150000,   date: '2026-03-01', description: '시설 보험료' },
  { id: 'f309', type: 'variable_expense', category: '교재비',     amount: 750000,   date: '2026-03-03', description: '3월 교재 구입' },
  { id: 'f310', type: 'variable_expense', category: '공과금',     amount: 360000,   date: '2026-03-15', description: '전기·수도 요금' },
  { id: 'f311', type: 'variable_expense', category: '마케팅',     amount: 450000,   date: '2026-03-10', description: '3월 SNS 광고 + 현수막' },
  { id: 'f312', type: 'variable_expense', category: '소모품',     amount: 110000,   date: '2026-03-08', description: '학원 소모품' },

  // ── 2026-04 (현재 월) ──
  { id: 'f401', type: 'income',           category: '수강료',     amount: 19600000, date: '2026-04-05', description: '4월 수강료 합계 (69명)' },
  { id: 'f402', type: 'income',           category: '교재/교구',  amount: 720000,   date: '2026-04-06', description: '4월 교재 판매 수입' },
  { id: 'f403', type: 'income',           category: '기타 수입',  amount: 200000,   date: '2026-04-10', description: '자료집 판매' },
  { id: 'f404', type: 'fixed_expense',    category: '임대료',     amount: 2200000,  date: '2026-04-01', description: '4월 학원 임대료' },
  { id: 'f405', type: 'fixed_expense',    category: '강사 급여',  amount: 8700000,  date: '2026-04-25', description: '4월 강사 급여 합계' },
  { id: 'f406', type: 'fixed_expense',    category: '스탭 급여',  amount: 2800000,  date: '2026-04-25', description: '4월 스탭 급여' },
  { id: 'f407', type: 'fixed_expense',    category: '인터넷/전화',amount: 180000,   date: '2026-04-05', description: '통신 요금' },
  { id: 'f408', type: 'fixed_expense',    category: '보험료',     amount: 150000,   date: '2026-04-01', description: '시설 보험료' },
  { id: 'f409', type: 'variable_expense', category: '교재비',     amount: 680000,   date: '2026-04-03', description: '4월 교재 구입' },
  { id: 'f410', type: 'variable_expense', category: '공과금',     amount: 410000,   date: '2026-04-15', description: '전기·수도 요금' },
  { id: 'f411', type: 'variable_expense', category: '마케팅',     amount: 300000,   date: '2026-04-10', description: '4월 SNS 광고' },
  { id: 'f412', type: 'variable_expense', category: '소모품',     amount: 85000,    date: '2026-04-08', description: '학원 소모품' },
];

// ─── DAILY REPORTS ────────────────────────────────────────────
export const mockDailyReports: DailyReportStatus[] = [
  { classId: 'c1', date: '2026-04-14', studentId: 's1',  sent: true,  sentAt: '17:35', parentPhone: '010-1111-2222' },
  { classId: 'c1', date: '2026-04-14', studentId: 's2',  sent: false, parentPhone: '010-2222-3333', note: '결석 — 미발송' },
  { classId: 'c1', date: '2026-04-14', studentId: 's6',  sent: true,  sentAt: '17:36', parentPhone: '010-6666-7777' },
  { classId: 'c1', date: '2026-04-14', studentId: 's9',  sent: true,  sentAt: '17:37', parentPhone: '010-9999-0000' },
  { classId: 'c1', date: '2026-04-14', studentId: 's11', sent: true,  sentAt: '17:38', parentPhone: '010-1122-3344' },
  { classId: 'c1', date: '2026-04-14', studentId: 's15', sent: true,  sentAt: '17:39', parentPhone: '010-5566-7788' },
  { classId: 'c2', date: '2026-04-15', studentId: 's3',  sent: true,  sentAt: '19:05', parentPhone: '010-3333-4444' },
  { classId: 'c2', date: '2026-04-15', studentId: 's4',  sent: false, parentPhone: '010-4444-5555', note: '조퇴 학생 별도 발송 필요' },
  { classId: 'c2', date: '2026-04-15', studentId: 's12', sent: true,  sentAt: '19:06', parentPhone: '010-2233-4455' },
  { classId: 'c3', date: '2026-04-14', studentId: 's1',  sent: true,  sentAt: '21:05', parentPhone: '010-1111-2222' },
  { classId: 'c3', date: '2026-04-14', studentId: 's5',  sent: false, parentPhone: '010-5555-6666', note: '결석 — 미발송' },
  { classId: 'c3', date: '2026-04-14', studentId: 's10', sent: true,  sentAt: '21:06', parentPhone: '010-0000-1111' },
  { classId: 'c3', date: '2026-04-14', studentId: 's13', sent: true,  sentAt: '21:07', parentPhone: '010-3344-5566' },
  { classId: 'c4', date: '2026-04-15', studentId: 's6',  sent: true,  sentAt: '19:35', parentPhone: '010-6666-7777' },
  { classId: 'c4', date: '2026-04-15', studentId: 's15', sent: false, parentPhone: '010-5566-7788', note: '발송 대기' },
  // ── 테스트 반 알림장 ──────────────────────────────────────────────────
  { classId: 'c_t1', date: '2026-04-13', studentId: 's_t1', sent: true,  sentAt: '17:40', parentPhone: '010-0000-0010' },
  { classId: 'c_t1', date: '2026-04-13', studentId: 's_t2', sent: true,  sentAt: '17:41', parentPhone: '010-0000-0010' },
  { classId: 'c_t1', date: '2026-04-13', studentId: 's_t3', sent: false, parentPhone: '010-0000-0020', note: '발송 대기' },
  { classId: 'c_t1', date: '2026-04-08', studentId: 's_t1', sent: true,  sentAt: '17:35', parentPhone: '010-0000-0010' },
  { classId: 'c_t1', date: '2026-04-08', studentId: 's_t2', sent: true,  sentAt: '17:36', parentPhone: '010-0000-0010' },
  { classId: 'c_t1', date: '2026-04-08', studentId: 's_t3', sent: true,  sentAt: '17:37', parentPhone: '010-0000-0020' },
  { classId: 'c_t2', date: '2026-04-14', studentId: 's_t1', sent: true,  sentAt: '19:05', parentPhone: '010-0000-0010' },
  { classId: 'c_t2', date: '2026-04-14', studentId: 's_t4', sent: true,  sentAt: '19:06', parentPhone: '010-0000-0010' },
  { classId: 'c_t2', date: '2026-04-09', studentId: 's_t1', sent: false, parentPhone: '010-0000-0010', note: '결석 — 미발송' },
  { classId: 'c_t2', date: '2026-04-09', studentId: 's_t4', sent: true,  sentAt: '19:08', parentPhone: '010-0000-0010' },
];

// ─── ENROLLMENT MGMT (수강관리 DB) ────────────────────────────
// 수강료: c1 영어 300,000 / c2 수학 320,000 / c3 국어 280,000 / c4 수학 310,000
// 레코드 = 학생 × 반 × 월  (2026-01 ~ 2026-04)
type TB = { name: string; pub: string; fee: number; paid: boolean; paidDate?: string };
function mkEM(
  id: string, sid: string, cid: string,
  eStart: string, eEnd: string | null,
  month: string, fee: number, due: string, paid: boolean, paidDate?: string,
  tb?: TB, memo?: string,
): EnrollmentMgmt {
  return {
    id, studentId: sid, classId: cid,
    enrollStartDate: eStart, enrollEndDate: eEnd,
    paymentMonth: month, tuitionFee: fee, tuitionDueDate: due,
    tuitionPaid: paid, tuitionPaidDate: paidDate,
    ...(tb ? {
      textbookName: tb.name, textbookPublisher: tb.pub,
      textbookFee: tb.fee, textbookPaid: tb.paid, textbookPaidDate: tb.paidDate,
    } : {}),
    memo,
  };
}

// ── 월별 레코드 자동 생성 (2024/2025 이력) ────────────────────
// 교재 스펙 (납부일 없이 이름·출판사·가격만 — genTuition 내부에서 자동 설정)
type TBRef = { name: string; pub: string; fee: number };
const GIU   : TBRef = { name: 'Grammar in Use Int.',  pub: 'Cambridge',    fee: 35000 };
const EBS_EN: TBRef = { name: 'EBS 중학영어 독해',    pub: 'EBS',          fee: 18000 };
const RPM_M2: TBRef = { name: '개념원리 중2 수학',    pub: 'RPM',          fee: 22000 };
const SEN2_M: TBRef = { name: '쎈 중2 수학',          pub: '좋은책신사고', fee: 20000 };
const BIS3_K: TBRef = { name: '비상 중3 국어',        pub: '비상교육',     fee: 20000 };
const KOR_G : TBRef = { name: '국어의 기술',           pub: '좋은책신사고', fee: 16000 };
const SEN1_M: TBRef = { name: '쎈 중1 수학',          pub: '좋은책신사고', fee: 20000 };
const CNY1_M: TBRef = { name: '개념+유형 중1 수학',   pub: '비상교육',     fee: 18000 };

function genTuition(
  prefix: string,
  sid: string, cid: string, enrollStart: string,
  months: string[],           // ['YYYY-MM', ...]
  fee: number,
  payDay: number,             // 0 = 익월 1일, else = 당월 N일
  tbMap?: Record<string, TBRef>, // YYYY-MM → 교재 스펙 (해당 월에만 교재비 추가)
): EnrollmentMgmt[] {
  return months.map((month, i) => {
    const [y, m] = month.split('-').map(Number);
    const dueDate = payDay === 0
      ? m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
      : `${month}-${String(payDay).padStart(2, '0')}`;
    const pd = new Date(dueDate);
    pd.setDate(pd.getDate() - 2);
    const tbSpec = tbMap?.[month];
    return {
      id: `${prefix}${String(i + 1).padStart(2, '0')}`,
      studentId: sid, classId: cid,
      enrollStartDate: enrollStart, enrollEndDate: null,
      paymentMonth: month, tuitionFee: fee,
      tuitionDueDate: dueDate, tuitionPaid: true,
      tuitionPaidDate: pd.toISOString().slice(0, 10),
      // 교재비: 해당 학기 첫 달에만 추가, 납부일은 월 초 5일로 자동 설정
      ...(tbSpec ? {
        textbookName: tbSpec.name,
        textbookPublisher: tbSpec.pub,
        textbookFee: tbSpec.fee,
        textbookPaid: true,
        textbookPaidDate: `${month}-05`,
      } : {}),
    };
  });
}
const ym = (y: number, from: number, to: number = 12) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${y}-${String(from + i).padStart(2, '0')}`);

// 2025년 전체 데이터
// 교재 구매 기준: 1학기(3월) · 2학기(9월) 시작 시 / 계속 수강생은 1월에 신규 교재 구매
const em2025: EnrollmentMgmt[] = [
  // c1 중1 영어 A반 (300,000원)
  // s1 김민준 — 1월 GIU(1학기), 9월 EBS(2학기 교재 변경)
  ...genTuition('e25a1_',  's1',  'c1', '2024-03-01', ym(2025, 1),  300000, 0,
    { '2025-01': GIU, '2025-09': EBS_EN }),
  // s2 이서연 — 1월 EBS(1학기), 9월 GIU(2학기)
  ...genTuition('e25a2_',  's2',  'c1', '2024-06-01', ym(2025, 1),  300000, 15,
    { '2025-01': EBS_EN, '2025-09': GIU }),
  // s6 강수아 — 3월 입원 시 GIU 구매
  ...genTuition('e25a6_',  's6',  'c1', '2025-03-01', ym(2025, 3),  300000, 0,
    { '2025-03': GIU }),
  // s11 노지민 — 9월 입원 시 EBS 구매
  ...genTuition('e25a11_', 's11', 'c1', '2025-09-01', ym(2025, 9),  300000, 0,
    { '2025-09': EBS_EN }),
  // s15 조민서 — 9월 입원 시 GIU 구매
  ...genTuition('e25a15_', 's15', 'c1', '2025-09-01', ym(2025, 9),  300000, 0,
    { '2025-09': GIU }),

  // c2 중2 수학 B반 (320,000원)
  // s3 박지호 — 3월 입원 RPM, 9월 쎈으로 교재 변경
  ...genTuition('e25b3_',  's3',  'c2', '2025-03-01', ym(2025, 3),  320000, 0,
    { '2025-03': RPM_M2, '2025-09': SEN2_M }),
  // s4 최아린 — 1월 쎈(1학기), 9월 RPM(2학기)
  ...genTuition('e25b4_',  's4',  'c2', '2024-06-01', ym(2025, 1),  320000, 0,
    { '2025-01': SEN2_M, '2025-09': RPM_M2 }),

  // c3 중3 국어 C반 (280,000원)
  // s1 김민준 — 1월 비상(1학기), 9월 국어의기술(2학기)
  ...genTuition('e25c1_',  's1',  'c3', '2024-09-01', ym(2025, 1),  280000, 0,
    { '2025-01': BIS3_K, '2025-09': KOR_G }),
  // s5 정현우 — 9월 입원 비상 구매
  ...genTuition('e25c5_',  's5',  'c3', '2025-09-01', ym(2025, 9),  280000, 20,
    { '2025-09': BIS3_K }),
  // s10 임채원 — 9월 입원 국어의기술 구매
  ...genTuition('e25c10_', 's10', 'c3', '2025-09-01', ym(2025, 9),  280000, 0,
    { '2025-09': KOR_G }),
  // s13 서하윤 — 3월 입원 국어의기술, 9월 비상으로 변경
  ...genTuition('e25c13_', 's13', 'c3', '2025-03-01', ym(2025, 3),  280000, 0,
    { '2025-03': KOR_G, '2025-09': BIS3_K }),

  // c4 중1 수학 D반 (310,000원)
  // s6 강수아 — 9월 입원 쎈 구매
  ...genTuition('e25d6_',  's6',  'c4', '2025-09-01', ym(2025, 9),  310000, 0,
    { '2025-09': SEN1_M }),
  // s15 조민서 — 9월 입원 개념+유형 구매
  ...genTuition('e25d15_', 's15', 'c4', '2025-09-01', ym(2025, 9),  310000, 0,
    { '2025-09': CNY1_M }),
];

// 2024년 데이터 (입원일 기준 시작)
const em2024: EnrollmentMgmt[] = [
  // c1 중1 영어 A반
  // s1 김민준 — 3월 입원 GIU(1학기), 9월 EBS(2학기)
  ...genTuition('e24a1_',  's1',  'c1', '2024-03-01', ym(2024, 3),  300000, 0,
    { '2024-03': GIU, '2024-09': EBS_EN }),
  // s2 이서연 — 6월 중간 입원 EBS 구매
  ...genTuition('e24a2_',  's2',  'c1', '2024-06-01', ym(2024, 6),  300000, 15,
    { '2024-06': EBS_EN }),
  // c2 중2 수학 B반
  // s4 최아린 — 6월 입원 RPM, 9월 쎈으로 변경
  ...genTuition('e24b4_',  's4',  'c2', '2024-06-01', ym(2024, 6),  320000, 0,
    { '2024-06': RPM_M2, '2024-09': SEN2_M }),
  // c3 중3 국어 C반 (2024-09부터 s1 추가)
  // s1 김민준 — 9월 국어 반 추가 시 비상 구매
  ...genTuition('e24c1_',  's1',  'c3', '2024-09-01', ym(2024, 9),  280000, 0,
    { '2024-09': BIS3_K }),
];

// 교재 상수 — 2026년 1월 (2학기 계속 사용 교재)
const TB_GIU  : TB = { name: 'Grammar in Use Int.',    pub: 'Cambridge',    fee: 35000, paid: true, paidDate: '2026-01-05' };
const TB_EBS  : TB = { name: 'EBS 중학영어 독해',       pub: 'EBS',          fee: 18000, paid: true, paidDate: '2026-01-07' };
const TB_RPM  : TB = { name: '개념원리 중2 수학',       pub: 'RPM',          fee: 22000, paid: true, paidDate: '2026-01-06' };
const TB_SEN2 : TB = { name: '쎈 중2 수학',             pub: '좋은책신사고', fee: 20000, paid: true, paidDate: '2026-01-06' };
const TB_BIS3 : TB = { name: '비상 중3 국어',           pub: '비상교육',     fee: 20000, paid: true, paidDate: '2026-01-08' };
const TB_KOR  : TB = { name: '국어의 기술',              pub: '좋은책신사고', fee: 16000, paid: true, paidDate: '2026-01-08' };
const TB_SEN1 : TB = { name: '쎈 중1 수학',             pub: '좋은책신사고', fee: 20000, paid: true, paidDate: '2026-01-09' };
const TB_CNY1 : TB = { name: '개념+유형 중1 수학',      pub: '비상교육',     fee: 18000, paid: true, paidDate: '2026-01-09' };

// 교재 상수 — 2026년 3월 (2026년 1학기 신규 교재)
const TB_GIU3 : TB = { name: 'Grammar in Use Upper-Int.', pub: 'Cambridge',    fee: 38000, paid: true, paidDate: '2026-03-04' };
const TB_EBS3 : TB = { name: 'EBS 중학영어 문법·어법',    pub: 'EBS',          fee: 16000, paid: true, paidDate: '2026-03-05' };
const TB_RPM3 : TB = { name: 'RPM 중2 수학 (B)',           pub: 'RPM',          fee: 22000, paid: true, paidDate: '2026-03-04' };
const TB_SEN23: TB = { name: '쎈 중2 수학 (B)',            pub: '좋은책신사고', fee: 20000, paid: true, paidDate: '2026-03-04' };
const TB_BIS33: TB = { name: '비상 중3 국어 심화',         pub: '비상교육',     fee: 22000, paid: true, paidDate: '2026-03-05' };
const TB_KOR3 : TB = { name: '국어의 기술 심화편',         pub: '좋은책신사고', fee: 17000, paid: true, paidDate: '2026-03-05' };
const TB_SEN13: TB = { name: '쎈 중1 수학 (B)',            pub: '좋은책신사고', fee: 20000, paid: true, paidDate: '2026-03-06' };
const TB_CNY13: TB = { name: '개념+유형 중1 수학 (B)',     pub: '비상교육',     fee: 18000, paid: true, paidDate: '2026-03-06' };

export const mockEnrollmentMgmt: EnrollmentMgmt[] = [
  // ─── c1 중1 영어 A반 (300,000/월) ─────────────────────────────────────────
  // s1 김민준 — 납부일 매월 1일(익월)
  mkEM('em001','s1','c1','2024-03-01',null,'2026-01',300000,'2026-02-01',true,'2026-01-28',TB_GIU),
  mkEM('em002','s1','c1','2024-03-01',null,'2026-02',300000,'2026-03-01',true,'2026-02-25'),
  mkEM('em003','s1','c1','2024-03-01',null,'2026-03',300000,'2026-04-01',true,'2026-03-28',TB_GIU3),
  mkEM('em004','s1','c1','2024-03-01',null,'2026-04',300000,'2026-05-01',true),
  // s2 이서연 — 납부일 매월 15일
  mkEM('em005','s2','c1','2024-06-01',null,'2026-01',300000,'2026-01-15',true,'2026-01-14',TB_EBS),
  mkEM('em006','s2','c1','2024-06-01',null,'2026-02',300000,'2026-02-15',true,'2026-02-13'),
  mkEM('em007','s2','c1','2024-06-01',null,'2026-03',300000,'2026-03-15',true,'2026-03-13',TB_EBS3),
  mkEM('em008','s2','c1','2024-06-01',null,'2026-04',300000,'2026-04-15',false,undefined,undefined,'납부 요청 문자 발송 완료'),
  // s6 강수아 — 납부일 매월 1일(익월)
  mkEM('em009','s6','c1','2025-03-01',null,'2026-01',300000,'2026-02-01',true,'2026-01-29',TB_EBS),
  mkEM('em010','s6','c1','2025-03-01',null,'2026-02',300000,'2026-03-01',true,'2026-02-26'),
  mkEM('em011','s6','c1','2025-03-01',null,'2026-03',300000,'2026-04-01',true,'2026-03-29',TB_GIU3),
  mkEM('em012','s6','c1','2025-03-01',null,'2026-04',300000,'2026-05-01',true),
  // s9 오승준 — 납부일 매월 1일(익월), 2026-01 입원
  mkEM('em013','s9','c1','2026-01-10',null,'2026-01',300000,'2026-02-01',true,'2026-01-30',TB_GIU),
  mkEM('em014','s9','c1','2026-01-10',null,'2026-02',300000,'2026-03-01',true,'2026-02-27'),
  mkEM('em015','s9','c1','2026-01-10',null,'2026-03',300000,'2026-04-01',true,'2026-03-30'),
  mkEM('em016','s9','c1','2026-01-10',null,'2026-04',300000,'2026-05-01',true),
  // s11 노지민 — 납부일 매월 1일(익월)
  mkEM('em017','s11','c1','2025-09-01',null,'2026-01',300000,'2026-02-01',true,'2026-01-28',TB_EBS),
  mkEM('em018','s11','c1','2025-09-01',null,'2026-02',300000,'2026-03-01',true,'2026-02-25'),
  mkEM('em019','s11','c1','2025-09-01',null,'2026-03',300000,'2026-04-01',true,'2026-03-28',TB_EBS3),
  mkEM('em020','s11','c1','2025-09-01',null,'2026-04',300000,'2026-05-01',true),
  // s15 조민서 — 납부일 매월 1일(익월)
  mkEM('em021','s15','c1','2025-09-01',null,'2026-01',300000,'2026-02-01',true,'2026-01-30',TB_EBS),
  mkEM('em022','s15','c1','2025-09-01',null,'2026-02',300000,'2026-03-01',true,'2026-02-27'),
  mkEM('em023','s15','c1','2025-09-01',null,'2026-03',300000,'2026-04-01',true,'2026-03-29',TB_GIU3),
  mkEM('em024','s15','c1','2025-09-01',null,'2026-04',300000,'2026-05-01',true),

  // ─── c2 중2 수학 B반 (320,000/월) ─────────────────────────────────────────
  // s3 박지호 — 납부일 매월 1일(익월)
  mkEM('em025','s3','c2','2025-03-01',null,'2026-01',320000,'2026-02-01',true,'2026-01-29',TB_RPM),
  mkEM('em026','s3','c2','2025-03-01',null,'2026-02',320000,'2026-03-01',true,'2026-02-26'),
  mkEM('em027','s3','c2','2025-03-01',null,'2026-03',320000,'2026-04-01',true,'2026-03-29',TB_RPM3),
  mkEM('em028','s3','c2','2025-03-01',null,'2026-04',320000,'2026-05-01',true),
  // s4 최아린 — 납부일 매월 1일(익월)
  mkEM('em029','s4','c2','2024-06-01',null,'2026-01',320000,'2026-02-01',true,'2026-01-28',TB_SEN2),
  mkEM('em030','s4','c2','2024-06-01',null,'2026-02',320000,'2026-03-01',true,'2026-02-25'),
  mkEM('em031','s4','c2','2024-06-01',null,'2026-03',320000,'2026-04-01',true,'2026-03-28',TB_SEN23),
  mkEM('em032','s4','c2','2024-06-01',null,'2026-04',320000,'2026-05-01',true),
  // s12 백승호 — 납부일 매월 18일, 2026-02 입원
  mkEM('em033','s12','c2','2026-02-01',null,'2026-02',320000,'2026-02-18',true,'2026-02-17',TB_SEN2),
  mkEM('em034','s12','c2','2026-02-01',null,'2026-03',320000,'2026-03-18',true,'2026-03-17'),
  mkEM('em035','s12','c2','2026-02-01',null,'2026-04',320000,'2026-04-18',false,undefined,undefined,'납부 요청 문자 발송 완료'),

  // ─── c3 중3 국어 C반 (280,000/월) ─────────────────────────────────────────
  // s1 김민준 — 납부일 매월 1일(익월) [c1과 병행 수강]
  mkEM('em036','s1','c3','2024-09-01',null,'2026-01',280000,'2026-02-01',true,'2026-01-28',TB_BIS3),
  mkEM('em037','s1','c3','2024-09-01',null,'2026-02',280000,'2026-03-01',true,'2026-02-25'),
  mkEM('em038','s1','c3','2024-09-01',null,'2026-03',280000,'2026-04-01',true,'2026-03-28',TB_BIS33),
  mkEM('em039','s1','c3','2024-09-01',null,'2026-04',280000,'2026-05-01',true),
  // s5 정현우 — 납부일 매월 20일
  mkEM('em040','s5','c3','2025-09-01',null,'2026-01',280000,'2026-01-20',true,'2026-01-19',TB_KOR),
  mkEM('em041','s5','c3','2025-09-01',null,'2026-02',280000,'2026-02-20',true,'2026-02-19'),
  mkEM('em042','s5','c3','2025-09-01',null,'2026-03',280000,'2026-03-20',true,'2026-03-19',TB_KOR3),
  mkEM('em043','s5','c3','2025-09-01',null,'2026-04',280000,'2026-04-20',false,undefined,undefined,'납부 요청 문자 발송 완료'),
  // s10 임채원 — 납부일 매월 1일(익월)
  mkEM('em044','s10','c3','2025-09-01',null,'2026-01',280000,'2026-02-01',true,'2026-01-29',TB_BIS3),
  mkEM('em045','s10','c3','2025-09-01',null,'2026-02',280000,'2026-03-01',true,'2026-02-26'),
  mkEM('em046','s10','c3','2025-09-01',null,'2026-03',280000,'2026-04-01',true,'2026-03-29',TB_BIS33),
  mkEM('em047','s10','c3','2025-09-01',null,'2026-04',280000,'2026-05-01',true),
  // s13 서하윤 — 납부일 매월 1일(익월)
  mkEM('em048','s13','c3','2025-03-01',null,'2026-01',280000,'2026-02-01',true,'2026-01-28',TB_KOR),
  mkEM('em049','s13','c3','2025-03-01',null,'2026-02',280000,'2026-03-01',true,'2026-02-25'),
  mkEM('em050','s13','c3','2025-03-01',null,'2026-03',280000,'2026-04-01',true,'2026-03-28',TB_KOR3),
  mkEM('em051','s13','c3','2025-03-01',null,'2026-04',280000,'2026-05-01',true),

  // ─── c4 중1 수학 D반 (310,000/월) ─────────────────────────────────────────
  // s6 강수아 — 납부일 매월 1일(익월) [c1과 병행 수강]
  mkEM('em052','s6','c4','2025-09-01',null,'2026-01',310000,'2026-02-01',true,'2026-01-29',TB_SEN1),
  mkEM('em053','s6','c4','2025-09-01',null,'2026-02',310000,'2026-03-01',true,'2026-02-26'),
  mkEM('em054','s6','c4','2025-09-01',null,'2026-03',310000,'2026-04-01',true,'2026-03-29',TB_SEN13),
  mkEM('em055','s6','c4','2025-09-01',null,'2026-04',310000,'2026-05-01',true),
  // s15 조민서 — 납부일 매월 1일(익월) [c1과 병행 수강]
  mkEM('em056','s15','c4','2025-09-01',null,'2026-01',310000,'2026-02-01',true,'2026-01-30',TB_CNY1),
  mkEM('em057','s15','c4','2025-09-01',null,'2026-02',310000,'2026-03-01',true,'2026-02-27'),
  mkEM('em058','s15','c4','2025-09-01',null,'2026-03',310000,'2026-04-01',true,'2026-03-29',TB_CNY13),
  mkEM('em059','s15','c4','2025-09-01',null,'2026-04',310000,'2026-05-01',true),

  // ─── 2026-05 수강관리 (모두 미납) ──────────────────────────────────────────
  // c1 중1 영어 A반 (300,000/월)
  mkEM('em060','s1', 'c1','2024-03-01',null,'2026-05',300000,'2026-06-01',false),
  mkEM('em061','s2', 'c1','2024-06-01',null,'2026-05',300000,'2026-05-15',false),
  mkEM('em062','s6', 'c1','2025-03-01',null,'2026-05',300000,'2026-06-01',false),
  mkEM('em063','s9', 'c1','2026-01-10',null,'2026-05',300000,'2026-06-01',false),
  mkEM('em064','s11','c1','2025-09-01',null,'2026-05',300000,'2026-06-01',false),
  mkEM('em065','s15','c1','2025-09-01',null,'2026-05',300000,'2026-06-01',false),
  // c2 중2 수학 B반 (320,000/월)
  mkEM('em066','s3', 'c2','2025-03-01',null,'2026-05',320000,'2026-06-01',false),
  mkEM('em067','s4', 'c2','2024-06-01',null,'2026-05',320000,'2026-06-01',false),
  mkEM('em068','s12','c2','2026-02-01',null,'2026-05',320000,'2026-05-18',false),
  // c3 중3 국어 C반 (280,000/월)
  mkEM('em069','s1', 'c3','2024-09-01',null,'2026-05',280000,'2026-06-01',false),
  mkEM('em070','s5', 'c3','2025-09-01',null,'2026-05',280000,'2026-05-20',false),
  mkEM('em071','s10','c3','2025-09-01',null,'2026-05',280000,'2026-06-01',false),
  mkEM('em072','s13','c3','2025-03-01',null,'2026-05',280000,'2026-06-01',false),
  // c4 중1 수학 D반 (310,000/월)
  mkEM('em073','s6', 'c4','2025-09-01',null,'2026-05',310000,'2026-06-01',false),
  mkEM('em074','s15','c4','2025-09-01',null,'2026-05',310000,'2026-06-01',false),

  // ─── 2025년 이력 ─────────────────────────────────────────────
  ...em2025,

  // ─── 2024년 이력 ─────────────────────────────────────────────
  ...em2024,

  // ─── 테스트 학생 수강관리 ─────────────────────────────────────
  // s_t1 테스트학생1 — c_t1 영어반 (300,000/월)
  mkEM('et001','s_t1','c_t1','2026-03-01',null,'2026-03',300000,'2026-04-01',true,'2026-03-28'),
  mkEM('et002','s_t1','c_t1','2026-03-01',null,'2026-04',300000,'2026-05-01',true,'2026-04-28'),
  mkEM('et003','s_t1','c_t1','2026-03-01',null,'2026-05',300000,'2026-06-01',false),
  // s_t1 테스트학생1 — c_t2 수학반 (310,000/월)
  mkEM('et004','s_t1','c_t2','2026-03-01',null,'2026-03',310000,'2026-04-01',true,'2026-03-29'),
  mkEM('et005','s_t1','c_t2','2026-03-01',null,'2026-04',310000,'2026-05-01',true,'2026-04-29'),
  mkEM('et006','s_t1','c_t2','2026-03-01',null,'2026-05',310000,'2026-06-01',false),
  // s_t2 테스트학생2 — c_t1 영어반 (미납 있음)
  mkEM('et007','s_t2','c_t1','2026-03-01',null,'2026-03',300000,'2026-04-01',true,'2026-03-30'),
  mkEM('et008','s_t2','c_t1','2026-03-01',null,'2026-04',300000,'2026-04-25',false,undefined,undefined,'납부 요청 문자 발송 완료'),
  mkEM('et009','s_t2','c_t1','2026-03-01',null,'2026-05',300000,'2026-06-01',false),
  // s_t3 테스트학생3 — c_t1 영어반
  mkEM('et010','s_t3','c_t1','2026-03-01',null,'2026-03',300000,'2026-04-01',true,'2026-03-29'),
  mkEM('et011','s_t3','c_t1','2026-03-01',null,'2026-04',300000,'2026-05-01',true,'2026-04-28'),
  mkEM('et012','s_t3','c_t1','2026-03-01',null,'2026-05',300000,'2026-06-01',false),
  // s_t4 테스트학생4 — c_t2 수학반
  mkEM('et013','s_t4','c_t2','2026-03-01',null,'2026-03',310000,'2026-04-01',true,'2026-03-28'),
  mkEM('et014','s_t4','c_t2','2026-03-01',null,'2026-04',310000,'2026-05-01',true,'2026-04-27'),
  mkEM('et015','s_t4','c_t2','2026-03-01',null,'2026-05',310000,'2026-06-01',false),
];

// ─── CLASS HISTORY ────────────────────────────────────────────
// 학생별 반 이동 이력 (classId가 빈 문자열이면 현재 DB에 없는 과거 반)
export const mockClassHistory: ClassHistoryRecord[] = [
  // s1 김민준 (2024-03-01 입원): c1 영어 + c3 국어 동시 수강
  { id: 'ch01', studentId: 's1', classId: 'c1', className: '중1 영어 A반', startDate: '2024-03-01', endDate: null },
  { id: 'ch02', studentId: 's1', classId: 'c3', className: '중3 국어 C반', startDate: '2024-09-01', endDate: null },

  // s2 이서연 (2024-03-01 입원): B반에서 A반으로 이동
  { id: 'ch03', studentId: 's2', classId: '',   className: '중1 영어 B반', startDate: '2024-03-01', endDate: '2024-05-31' },
  { id: 'ch04', studentId: 's2', classId: 'c1', className: '중1 영어 A반', startDate: '2024-06-01', endDate: null },

  // s3 박지호 (2024-06-01 입원): 수학 A반에서 B반으로 이동
  { id: 'ch05', studentId: 's3', classId: '',   className: '중2 수학 A반', startDate: '2024-06-01', endDate: '2025-02-28' },
  { id: 'ch06', studentId: 's3', classId: 'c2', className: '중2 수학 B반', startDate: '2025-03-01', endDate: null },

  // s4 최아린 (2024-06-01 입원): B반 계속 유지
  { id: 'ch07', studentId: 's4', classId: 'c2', className: '중2 수학 B반', startDate: '2024-06-01', endDate: null },

  // s5 정현우 (2025-01-05 입원): 국어 B반에서 C반으로 이동
  { id: 'ch08', studentId: 's5', classId: '',   className: '중3 국어 B반', startDate: '2025-01-05', endDate: '2025-08-31' },
  { id: 'ch09', studentId: 's5', classId: 'c3', className: '중3 국어 C반', startDate: '2025-09-01', endDate: null },

  // s6 강수아 (2025-03-01 입원): 영어 A반 + 2학기부터 수학 D반 추가
  { id: 'ch10', studentId: 's6', classId: 'c1', className: '중1 영어 A반', startDate: '2025-03-01', endDate: null },
  { id: 'ch11', studentId: 's6', classId: 'c4', className: '중1 수학 D반', startDate: '2025-09-01', endDate: null },

  // s9 오승준 (2026-01-10 입원): A반 입원
  { id: 'ch12', studentId: 's9', classId: 'c1', className: '중1 영어 A반', startDate: '2026-01-10', endDate: null },

  // s10 임채원 (2025-03-01 입원): 국어 B반에서 C반으로 이동
  { id: 'ch13', studentId: 's10', classId: '',   className: '중3 국어 B반', startDate: '2025-03-01', endDate: '2025-08-31' },
  { id: 'ch14', studentId: 's10', classId: 'c3', className: '중3 국어 C반', startDate: '2025-09-01', endDate: null },

  // s11 노지민 (2025-09-01 입원): A반 입원
  { id: 'ch15', studentId: 's11', classId: 'c1', className: '중1 영어 A반', startDate: '2025-09-01', endDate: null },

  // s12 백승호 (2025-09-01 입원): 수학 A반에서 B반으로 이동
  { id: 'ch16', studentId: 's12', classId: '',   className: '중2 수학 A반', startDate: '2025-09-01', endDate: '2026-01-31' },
  { id: 'ch17', studentId: 's12', classId: 'c2', className: '중2 수학 B반', startDate: '2026-02-01', endDate: null },

  // s13 서하윤 (2025-03-01 입원): C반 계속 유지
  { id: 'ch18', studentId: 's13', classId: 'c3', className: '중3 국어 C반', startDate: '2025-03-01', endDate: null },

  // s15 조민서 (2025-03-01 입원): 영어 B반→A반 이동 + 수학 D반 추가
  { id: 'ch19', studentId: 's15', classId: '',   className: '중1 영어 B반', startDate: '2025-03-01', endDate: '2025-08-31' },
  { id: 'ch20', studentId: 's15', classId: 'c1', className: '중1 영어 A반', startDate: '2025-09-01', endDate: null },
  { id: 'ch21', studentId: 's15', classId: 'c4', className: '중1 수학 D반', startDate: '2025-09-01', endDate: null },
];

// ─── OBSERVATIONS ─────────────────────────────────────────────
export const mockObservations: ObservationRecord[] = [
  // c1 중1 영어 A반 — s1 김민준
  { id: 'ob01', classId: 'c1', studentId: 's1', date: '2026-04-07', note: '오늘 수업 집중도가 매우 높았음. 단어 암기 속도가 빠름.', parentNote: '단어장 추가로 복습하면 더욱 좋겠습니다.' },
  { id: 'ob02', classId: 'c1', studentId: 's1', date: '2026-04-14', note: '리딩 파트에서 해석 능력이 향상됨. 칭찬함.', parentNote: '이번 주 리딩 복습을 권장합니다.' },
  { id: 'ob03', classId: 'c1', studentId: 's1', date: '2026-04-21', note: '발표 활동에서 자신감 있게 참여함.', parentNote: '' },
  // c1 — s2 이서연
  { id: 'ob04', classId: 'c1', studentId: 's2', date: '2026-04-07', note: '결석 이후 복습이 부족함. 보충 필요.', parentNote: '지난 주 내용을 다시 확인해 주세요.' },
  { id: 'ob05', classId: 'c1', studentId: 's2', date: '2026-04-21', note: '문법 실수가 반복됨. 해당 단원 재연습 권유.', parentNote: '문법 문제집 추가 풀이 바랍니다.' },
  // c1 — s6 강수아
  { id: 'ob06', classId: 'c1', studentId: 's6', date: '2026-04-14', note: '발표할 때 목소리가 작음. 자신감 향상 필요.', parentNote: '' },
  { id: 'ob07', classId: 'c1', studentId: 's6', date: '2026-04-21', note: '모둠 활동에서 적극적으로 참여함. 발전이 보임.', parentNote: '발표 연습을 집에서도 해주세요.' },
  // c4 중1 수학 D반 — s6 강수아
  { id: 'ob08', classId: 'c4', studentId: 's6', date: '2026-04-08', note: '방정식 풀이 과정에서 실수가 잦음. 풀이 단계를 꼼꼼히 쓰도록 지도함.', parentNote: '수학 오답노트 작성을 권장합니다.' },
  { id: 'ob09', classId: 'c4', studentId: 's15', date: '2026-04-15', note: '개념 이해도가 높아짐. 응용 문제도 도전해보도록 격려함.', parentNote: '심화 문제집을 병행하면 좋겠습니다.' },
  // ── 테스트 반 관찰 기록 ──────────────────────────────────────────────────
  { id: 'ob_t1', classId: 'c_t1', studentId: 's_t1', date: '2026-04-13', note: '수업 집중도가 매우 높고 발표 참여도 우수. 단어 암기 속도가 빠름.', parentNote: '단어장을 이용해 추가 복습하면 좋겠습니다.' },
  { id: 'ob_t2', classId: 'c_t1', studentId: 's_t2', date: '2026-04-13', note: '문법 이해는 양호하나 쓰기 연습이 더 필요함. 작문 과제 꾸준히 지도 중.', parentNote: '교재 쓰기 파트를 추가로 연습시켜 주세요.' },
  { id: 'ob_t3', classId: 'c_t1', studentId: 's_t3', date: '2026-04-10', note: '지난 결석 후 복습이 잘 됨. 내용을 잘 따라오고 있음.', parentNote: '결석분 보충이 잘 됐습니다. 계속 응원 부탁드립니다.' },
  { id: 'ob_t4', classId: 'c_t1', studentId: 's_t1', date: '2026-04-01', note: '발표 활동에서 자신감 있게 참여함. 리더십도 보임.', parentNote: '' },
  { id: 'ob_t5', classId: 'c_t2', studentId: 's_t1', date: '2026-04-16', note: '이차방정식 근의 공식 적용이 매우 정확함. 응용 문제도 도전하도록 격려함.', parentNote: '심화 문제집을 병행하면 좋겠습니다.' },
  { id: 'ob_t6', classId: 'c_t2', studentId: 's_t4', date: '2026-04-16', note: '계산 실수가 줄어들고 있음. 서술형 문제 연습이 더 필요함.', parentNote: '서술형 답안 작성 연습을 집에서도 해주세요.' },
  { id: 'ob_t7', classId: 'c_t2', studentId: 's_t4', date: '2026-04-07', note: '지각했지만 수업 태도는 성실함. 교통편 문제 확인 필요.', parentNote: '등원 시간에 여유를 두고 출발해 주세요.' },
];

// ─── TEXTBOOKS ────────────────────────────────────────────────
export const mockTextbooks: Textbook[] = [
  { id: 'tb1', name: 'Grammar in Use Intermediate',       publisher: 'Cambridge',   price: 35000, subject: '영어' },
  { id: 'tb2', name: 'Grammar in Use Upper-Intermediate', publisher: 'Cambridge',   price: 38000, subject: '영어' },
  { id: 'tb3', name: 'Grammar in Use Elementary',         publisher: 'Cambridge',   price: 32000, subject: '영어' },
  { id: 'tb4', name: 'Vocabulary Power',                  publisher: 'Build & Grow', price: 12000, subject: '영어' },
  { id: 'tb5', name: 'RPM 수학 중2',                      publisher: '에듀왕',      price: 18000, subject: '수학' },
  { id: 'tb6', name: '쎈 수학 중2',                       publisher: 'NE능률',      price: 18000, subject: '수학' },
  { id: 'tb7',  name: '중학국어 비문학독해',                 publisher: '미래엔',      price: 16000, subject: '국어' },
  { id: 'tb8',  name: '1등급 만들기 국어',                  publisher: 'NE능률',      price: 14000, subject: '국어' },
  { id: 'tb9',  name: 'Reading Explorer 2',               publisher: 'National Geographic', price: 22000, subject: '영어' },
  { id: 'tb10', name: 'This Is Grammar 중급',              publisher: '넥서스',       price: 13000, subject: '영어' },
  { id: 'tb11', name: '수학의 정석 중2',                    publisher: '성문출판사',  price: 15000, subject: '수학' },
  { id: 'tb12', name: '개념원리 수학 중2',                  publisher: '개념원리',    price: 16000, subject: '수학' },
  { id: 'tb13', name: '최상위 수학 중3',                    publisher: '디딤돌',      price: 17000, subject: '수학' },
  { id: 'tb14', name: '자이스토리 영어 독해',               publisher: '수경출판사',  price: 13000, subject: '영어' },
  { id: 'tb15', name: '중학 과학 탐구',                     publisher: '천재교육',    price: 14000, subject: '과학' },
  { id: 'tb16', name: '중학 사회 개념완성',                  publisher: '미래엔',      price: 13000, subject: '사회' },
  { id: 'tb17', name: 'EBS 중학 영문법 총정리',             publisher: 'EBS',         price: 10000, subject: '영어' },
  { id: 'tb18', name: '고등 수학 기본서',                    publisher: '교학사',      price: 20000, subject: '수학' },
];

// ─── WITHDRAWAL STATS ─────────────────────────────────────────
export const withdrawalStats = [
  { month: '2025-10', count: 1, reasons: { '이사': 1 },              teachers: { '이수진': 0, '박민호': 1, '최지혜': 0 }, grades: { '중1': 0, '중2': 1, '중3': 0 }, students: ['박철수'], teacherStudents: { '박민호': ['박철수'] } },
  { month: '2025-11', count: 2, reasons: { '성적부진': 1, '타학원이동': 1 }, teachers: { '이수진': 1, '박민호': 0, '최지혜': 1 }, grades: { '중1': 1, '중2': 0, '중3': 1 }, students: ['김유리', '최동훈'], teacherStudents: { '이수진': ['김유리'], '최지혜': ['최동훈'] } },
  { month: '2025-12', count: 1, reasons: { '경제적사유': 1 },         teachers: { '이수진': 0, '박민호': 0, '최지혜': 1 }, grades: { '중1': 0, '중2': 0, '중3': 1 }, students: ['이민수'], teacherStudents: { '최지혜': ['이민수'] } },
  { month: '2026-01', count: 1, reasons: { '타학원이동': 1 },         teachers: { '이수진': 0, '박민호': 1, '최지혜': 0 }, grades: { '중1': 0, '중2': 1, '중3': 0 }, students: ['안준혁'], teacherStudents: { '박민호': ['안준혁'] } },
  { month: '2026-02', count: 1, reasons: { '이사': 1 },              teachers: { '이수진': 0, '박민호': 0, '최지혜': 1 }, grades: { '중1': 0, '중2': 0, '중3': 1 }, students: ['윤도현'], teacherStudents: { '최지혜': ['윤도현'] } },
  { month: '2026-03', count: 1, reasons: { '성적부진': 1 },           teachers: { '이수진': 0, '박민호': 1, '최지혜': 0 }, grades: { '중1': 0, '중2': 1, '중3': 0 }, students: ['한예린'], teacherStudents: { '박민호': ['한예린'] } },
  { month: '2026-04', count: 0, reasons: {},                         teachers: { '이수진': 0, '박민호': 0, '최지혜': 0 }, grades: { '중1': 0, '중2': 0, '중3': 0 }, students: [], teacherStudents: {} },
];

// ─── DB 관리 테이블 초기값 (빈 배열 — 실제 데이터는 사용자가 입력) ────────────
export const mockClassConfigs: ClassConfig[] = [];
export const mockClassNotices: ClassNotice[] = [];
export const mockFinanceMemos: FinanceMemo[] = [];
export const mockClassSettings: ClassSettings[] = [];
