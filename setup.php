<?php
// ─────────────────────────────────────────────────────────────────────────
// setup.php  –  최초 1회 실행: DB 테이블 생성 + 초기 사용자 등록
//
// 사용법:
//   1. db_config.php 에서 DB 접속 정보를 수정하세요
//   2. 브라우저에서 https://your-domain/setup.php 접속
//   3. "Setup complete" 메시지 확인 후 반드시 이 파일을 삭제하세요!
// ─────────────────────────────────────────────────────────────────────────
require_once __DIR__ . '/db_config.php';

header('Content-Type: text/html; charset=utf-8');

function ok($msg) { echo "<p style='color:green'>✔ $msg</p>"; }
function fail($msg) { echo "<p style='color:red'>✘ $msg</p>"; exit; }

echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Setup</title></head><body>";
echo "<h2>학원관리 시스템 — DB 초기화</h2>";

// ── PDO 연결 ──────────────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    ok("DB 연결 성공");
} catch (Exception $e) {
    fail("DB 연결 실패: " . $e->getMessage());
}

// ── ams_data 테이블 (애플리케이션 데이터) ─────────────────────────────────
$pdo->exec("
    CREATE TABLE IF NOT EXISTS ams_data (
        table_name  VARCHAR(60)   NOT NULL,
        row_index   INT           NOT NULL,
        row_data    MEDIUMTEXT    NOT NULL,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (table_name, row_index)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
ok("ams_data 테이블 생성/확인");

// ── ams_auth 테이블 (로그인 인증) ─────────────────────────────────────────
$pdo->exec("
    CREATE TABLE IF NOT EXISTS ams_auth (
        user_id        VARCHAR(50)   PRIMARY KEY,
        email          VARCHAR(200)  UNIQUE NOT NULL,
        password_hash  VARCHAR(255)  NOT NULL,
        updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
ok("ams_auth 테이블 생성/확인");

// ── 초기 사용자 등록 (기본 비밀번호: 1234) ────────────────────────────────
$defaultUsers = [
    ['u1', 'admin@academy.com',    '관리자(학원장)'],
    ['u2', 'teacher1@academy.com', '선생님1 이수진'],
    ['u3', 'teacher2@academy.com', '선생님2 박민호'],
    ['u4', 'teacher3@academy.com', '선생님3 최지혜'],
    ['u5', 'staff@academy.com',    '스탭 정서연'],
    ['u6', 'parent1@gmail.com',    '학부모 김학부'],
];

$hash = password_hash('1234', PASSWORD_BCRYPT);
$stmt = $pdo->prepare(
    "INSERT IGNORE INTO ams_auth (user_id, email, password_hash) VALUES (?, ?, ?)"
);
foreach ($defaultUsers as [$uid, $email, $name]) {
    $stmt->execute([$uid, $email, $hash]);
    ok("사용자 등록: $name ($email) / 기본 비밀번호: 1234");
}

// ── 완료 ──────────────────────────────────────────────────────────────────
echo "<hr>";
echo "<h3 style='color:green'>✔ 설정 완료!</h3>";
echo "<p><strong>보안 주의:</strong> 설정이 완료되었으니 <code>setup.php</code> 파일을 서버에서 즉시 삭제하세요.</p>";
echo "<p>앱에 접속하여 이메일/비밀번호로 로그인하면 데이터가 자동으로 DB에 저장됩니다.</p>";
echo "</body></html>";
