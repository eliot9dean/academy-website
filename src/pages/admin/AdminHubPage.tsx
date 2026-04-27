import { useNavigate } from 'react-router-dom';

const roles = [
  {
    role: 'admin',
    label: '관리자 (학원장)',
    icon: '👑',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    path: '/admin/classes',
    description: '학원 전체 현황 관리',
  },
  {
    role: 'teacher',
    label: '선생님',
    icon: '📚',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    path: '/teacher/classes',
    description: '담당반 출결 및 수업 관리',
  },
  {
    role: 'staff',
    label: '스탭 (데스크/부원장)',
    icon: '🖥️',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    path: '/staff/students',
    description: '학생관리 및 재무 관리',
  },
  {
    role: 'parent',
    label: '학부모',
    icon: '👨‍👩‍👧',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    path: '/parent/dashboard',
    description: '자녀 출결 및 성적 확인',
  },
];

export default function AdminHubPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">🏫</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">학원관리 시스템</h1>
        <p className="text-gray-500 mt-2 text-sm">이동할 화면을 선택하세요</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {roles.map(r => (
          <button
            key={r.role}
            onClick={() => navigate(r.path)}
            className={`p-5 border-2 rounded-2xl text-left transition-all shadow-sm hover:shadow-md ${r.color}`}
          >
            <div className="text-3xl mb-3">{r.icon}</div>
            <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
            <div className="text-gray-500 text-xs mt-1">{r.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
