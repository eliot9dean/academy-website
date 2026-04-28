import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_ENABLED } from '../../config/api';
import { supabase } from '../../lib/supabase';
import { mockUsers } from '../../data/mockData';
import type { User, UserRole } from '../../types';

const roleConfig = [
  { role: 'admin'   as UserRole, label: '관리자 (학원장)',      icon: '👑', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100', path: '/admin/classes',    description: '학원 전체 현황 관리' },
  { role: 'teacher' as UserRole, label: '선생님',               icon: '📚', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',        path: '/teacher/classes',  description: '담당반 출결 및 수업 관리' },
  { role: 'staff'   as UserRole, label: '스탭 (데스크/부원장)', icon: '🖥️', color: 'bg-green-50 border-green-200 hover:bg-green-100',     path: '/staff/students',   description: '학생관리 및 재무 관리' },
  { role: 'parent'  as UserRole, label: '학부모',               icon: '👨‍👩‍👧', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100', path: '/parent/dashboard', description: '자녀 출결 및 성적 확인' },
];

const roleBadgeColor: Record<UserRole, string> = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  staff:   'bg-green-100 text-green-700',
  parent:  'bg-orange-100 text-orange-700',
};

export default function AdminHubPage() {
  const navigate = useNavigate();
  const { setViewAsUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // 역할 선택 시 해당 역할 사용자 목록 로드
  useEffect(() => {
    if (!selectedRole) return;
    setLoading(true);

    if (SUPABASE_ENABLED) {
      supabase
        .from('user_profiles')
        .select('*')
        .eq('role', selectedRole)
        .then(({ data }) => {
          // app_user_id를 id로 매핑 (수업 데이터의 teacherId 등과 일치시키기 위해)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = (data ?? []).map((p: any) => ({
            ...(p as User),
            id: (p.app_user_id as string) || (p.id as string),
          }));
          setUsers(mapped);
          setLoading(false);
        });
    } else {
      setUsers(mockUsers.filter(u => u.role === selectedRole));
      setLoading(false);
    }
  }, [selectedRole]);

  const handleUserSelect = (user: User) => {
    const config = roleConfig.find(r => r.role === user.role)!;
    setViewAsUser(user);
    navigate(config.path);
  };

  const selectedConfig = roleConfig.find(r => r.role === selectedRole);

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">🏫</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">학원관리 시스템</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {selectedRole ? `${selectedConfig?.label} 계정을 선택하세요` : '이동할 역할을 선택하세요'}
        </p>
      </div>

      {/* Step 1: 역할 선택 */}
      {!selectedRole && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {roleConfig.map(r => (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              className={`p-5 border-2 rounded-2xl text-left transition-all shadow-sm hover:shadow-md ${r.color}`}
            >
              <div className="text-3xl mb-3">{r.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
              <div className="text-gray-500 text-xs mt-1">{r.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: 사용자 선택 */}
      {selectedRole && (
        <div className="w-full max-w-md">
          {/* 뒤로 가기 */}
          <button
            onClick={() => { setSelectedRole(null); setUsers([]); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
          >
            ← 역할 선택으로 돌아가기
          </button>

          {loading ? (
            <div className="text-center py-12 text-gray-400">불러오는 중…</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">{selectedConfig?.icon}</div>
              <p className="text-sm">등록된 {selectedConfig?.label} 계정이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  {/* 아바타 */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                    {user.name[0]}
                  </div>
                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{user.name}</div>
                    <div className="text-gray-400 text-xs truncate mt-0.5">{user.email}</div>
                  </div>
                  {/* 배지 */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${roleBadgeColor[user.role]}`}>
                    {selectedConfig?.label}
                  </span>
                  <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-sm">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
