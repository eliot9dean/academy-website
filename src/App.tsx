import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SetPasswordPage from './pages/SetPasswordPage';
import Layout from './components/Layout';

// Admin
import AdminHubPage from './pages/admin/AdminHubPage';
import AdminClassesPage from './pages/admin/AdminClassesPage';
import AdminSchedulePage from './pages/admin/AdminSchedulePage';
import AdminDailyReportsPage from './pages/admin/AdminDailyReportsPage';
import AdminConversionPage from './pages/admin/AdminConversionPage';
import AdminWithdrawalPage from './pages/admin/AdminWithdrawalPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminDatabasePage from './pages/admin/AdminDatabasePage';

// Teacher
import TeacherClassesPage from './pages/teacher/TeacherClassesPage';
import TeacherClassDetailPage from './pages/teacher/TeacherClassDetailPage';
import TeacherLessonLogPage from './pages/teacher/TeacherLessonLogPage';

// Staff
import StaffStudentsPage from './pages/staff/StaffStudentsPage';
import StaffTuitionPage from './pages/staff/StaffTuitionPage';
import StaffEnrollmentPage from './pages/staff/StaffEnrollmentPage';
import StaffFinancePage from './pages/staff/StaffFinancePage';
import StaffTextbookPage from './pages/staff/StaffTextbookPage';

// Parent
import ParentDashboardPage from './pages/parent/ParentDashboardPage';

function AppRoutes() {
  return (
    <Routes>
          <Route path="/" element={<LoginPage />} />
          {/* 비밀번호 재설정 링크 전용 페이지 */}
          <Route path="/set-password" element={<SetPasswordPage />} />

          {/* Admin */}
          <Route path="/admin" element={<Layout />}>
            <Route index element={<AdminHubPage />} />
            <Route path="classes" element={<AdminClassesPage />} />
            <Route path="schedule" element={<AdminSchedulePage />} />
            <Route path="daily-reports" element={<AdminDailyReportsPage />} />
            <Route path="conversion" element={<AdminConversionPage />} />
            <Route path="withdrawal" element={<AdminWithdrawalPage />} />
            <Route path="finance" element={<AdminFinancePage />} />
            <Route path="database" element={<AdminDatabasePage />} />
          </Route>

          {/* Teacher */}
          <Route path="/teacher" element={<Layout />}>
            <Route index element={<Navigate to="/teacher/classes" replace />} />
            <Route path="classes" element={<TeacherClassesPage />} />
            <Route path="class/:classId" element={<TeacherClassDetailPage />} />
            <Route path="lesson-log" element={<TeacherLessonLogPage />} />
          </Route>

          {/* Staff */}
          <Route path="/staff" element={<Layout />}>
            <Route index element={<Navigate to="/staff/students" replace />} />
            <Route path="students"   element={<StaffStudentsPage />} />
            <Route path="tuition"    element={<StaffTuitionPage />} />
            <Route path="textbooks"  element={<StaffTextbookPage />} />
            <Route path="enrollment" element={<StaffEnrollmentPage />} />
            <Route path="finance"    element={<StaffFinancePage />} />
          </Route>

          {/* Parent */}
          <Route path="/parent" element={<Layout />}>
            <Route index element={<Navigate to="/parent/dashboard" replace />} />
            <Route path="dashboard" element={<ParentDashboardPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
