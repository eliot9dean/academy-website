-- ═══════════════════════════════════════════════════════════════════════════
-- 학원관리 시스템 — Supabase 초기화 SQL
-- Supabase 대시보드 > SQL Editor 에 붙여넣기 후 실행
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. 데이터 테이블 ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ams_tables (
  name       TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자동 updated_at 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER ams_tables_updated_at
  BEFORE UPDATE ON ams_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 활성화 (로그인한 사용자만 접근 가능)
ALTER TABLE ams_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_access" ON ams_tables;
CREATE POLICY "authenticated_access" ON ams_tables
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── 2. 유저 프로필 테이블 ────────────────────────────────────────────────────
-- auth.users 와 앱 사용자 정보를 연결
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID  REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  app_user_id TEXT  NOT NULL,   -- 'u1', 'u2', ...
  role        TEXT  NOT NULL,   -- 'admin', 'teacher', 'staff', 'parent'
  name        TEXT  NOT NULL,
  email       TEXT  NOT NULL,
  phone       TEXT,
  ssn         TEXT,
  address     TEXT,
  "joinDate"  TEXT
);

-- RLS: 로그인한 사용자 읽기 + 자기 자신 프로필 생성 허용
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read" ON user_profiles;
CREATE POLICY "auth_read" ON user_profiles
  FOR SELECT TO authenticated
  USING (true);

-- 회원가입 시 자신의 프로필 insert 허용
DROP POLICY IF EXISTS "auth_insert_own" ON user_profiles;
CREATE POLICY "auth_insert_own" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());


-- ── 3. 유저 프로필 삽입 ──────────────────────────────────────────────────────
-- ★ 주의: 아래 SQL은 Supabase 대시보드 Authentication > Users 에서
--   각 이메일로 사용자를 먼저 생성한 뒤 실행해야 합니다.
--   (초기 비밀번호: 1234)
--
-- 생성할 계정:
--   admin@academy.com    (관리자)
--   teacher1@academy.com (선생님 이수진)
--   teacher2@academy.com (선생님 박민호)
--   teacher3@academy.com (선생님 최지혜)
--   staff@academy.com    (스탭 정서연)
--   parent1@gmail.com    (학부모 김학부)

INSERT INTO user_profiles (id, app_user_id, role, name, email, phone, "joinDate")
SELECT id, 'u1', 'admin', '김원장', email, '010-1234-5678', '2019-03-02'
FROM auth.users WHERE email = 'admin@academy.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, app_user_id, role, name, email, phone, "joinDate")
SELECT id, 'u2', 'teacher', '이수진', email, '010-2345-6789', '2020-09-01'
FROM auth.users WHERE email = 'teacher1@academy.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, app_user_id, role, name, email, phone, "joinDate")
SELECT id, 'u3', 'teacher', '박민호', email, '010-3456-7890', '2021-03-02'
FROM auth.users WHERE email = 'teacher2@academy.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, app_user_id, role, name, email, phone, "joinDate")
SELECT id, 'u4', 'teacher', '최지혜', email, '010-4567-8901', '2022-09-01'
FROM auth.users WHERE email = 'teacher3@academy.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, app_user_id, role, name, email, phone, "joinDate")
SELECT id, 'u5', 'staff', '정서연', email, '010-5678-9012', '2023-01-02'
FROM auth.users WHERE email = 'staff@academy.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, app_user_id, role, name, email, phone)
SELECT id, 'u6', 'parent', '김학부', email, '010-6789-0123'
FROM auth.users WHERE email = 'parent1@gmail.com'
ON CONFLICT (id) DO NOTHING;
