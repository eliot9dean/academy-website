<?php
// ─────────────────────────────────────────────────────────────────────────
// api.php  –  학원관리 SPA REST API
//
// 엔드포인트:
//   POST  api.php  { action:"login",          email, password }
//   GET   api.php?action=getAll                 (Bearer 토큰 필요)
//   POST  api.php  { action:"saveTable",       table, rows }  (Bearer 토큰 필요)
//   POST  api.php  { action:"changePassword",  oldPassword, newPassword }
// ─────────────────────────────────────────────────────────────────────────
require_once __DIR__ . '/db_config.php';

// ── CORS / 헤더 ────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// ── 에러 핸들러 ───────────────────────────────────────────────────────────
set_exception_handler(function(Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
});

// ── PDO 싱글턴 ─────────────────────────────────────────────────────────────
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    return $pdo;
}

// ── 토큰 생성 ─────────────────────────────────────────────────────────────
function makeToken(string $userId): string {
    $ts   = time();
    $hmac = hash_hmac('sha256', $userId . ':' . $ts, API_SECRET);
    return base64_encode($userId . ':' . $ts . ':' . $hmac);
}

// ── 토큰 검증 → userId 반환 (실패 시 401 종료) ────────────────────────────
function requireAuth(): string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
        http_response_code(401);
        die(json_encode(['error' => '인증 토큰이 필요합니다']));
    }
    $raw   = base64_decode($m[1]);
    $parts = explode(':', $raw, 3);
    if (count($parts) !== 3) {
        http_response_code(401);
        die(json_encode(['error' => '잘못된 토큰 형식']));
    }
    [$userId, $ts, $hmac] = $parts;
    if (time() - (int)$ts > TOKEN_TTL) {
        http_response_code(401);
        die(json_encode(['error' => '토큰이 만료되었습니다. 다시 로그인하세요.']));
    }
    $expected = hash_hmac('sha256', $userId . ':' . $ts, API_SECRET);
    if (!hash_equals($expected, $hmac)) {
        http_response_code(401);
        die(json_encode(['error' => '유효하지 않은 토큰']));
    }
    return $userId;
}

// ── 허용 테이블 목록 ──────────────────────────────────────────────────────
const ALLOWED_TABLES = [
    'users', 'students', 'classes', 'attendance', 'dailyProgress',
    'homework', 'testScores', 'observations', 'schedule',
    'consultations', 'financials', 'dailyReports', 'classHistory', 'enrollmentMgmt',
];

// ── 요청 파싱 ─────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$body   = [];
if ($method === 'POST') {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? [];
}
$action = $_GET['action'] ?? $body['action'] ?? '';

// ── 라우팅 ────────────────────────────────────────────────────────────────
switch ($action) {

// ─────────────────────────────────────────────────────────────────────────
// 로그인
// ─────────────────────────────────────────────────────────────────────────
case 'login':
    $email    = trim($body['email']    ?? '');
    $password = trim($body['password'] ?? '');
    if (!$email || !$password) {
        http_response_code(400);
        die(json_encode(['error' => 'email과 password를 입력하세요']));
    }

    // 인증 정보 조회
    $stmt = db()->prepare("SELECT user_id, password_hash FROM ams_auth WHERE email = ?");
    $stmt->execute([$email]);
    $authRow = $stmt->fetch();

    if (!$authRow || !password_verify($password, $authRow['password_hash'])) {
        http_response_code(401);
        die(json_encode(['error' => '이메일 또는 비밀번호가 올바르지 않습니다']));
    }

    $userId = $authRow['user_id'];

    // users 테이블에서 사용자 정보 조회 (PHP에서 필터)
    $stmt2 = db()->prepare("SELECT row_data FROM ams_data WHERE table_name='users'");
    $stmt2->execute();
    $userData = null;
    while ($r = $stmt2->fetch()) {
        $u = json_decode($r['row_data'], true);
        if (($u['id'] ?? '') === $userId) { $userData = $u; break; }
    }

    // ams_data에 아직 users 데이터가 없으면(첫 로그인) userData는 null
    // → 프론트에서 mockData로 초기화 후 saveTable 하게 됨

    echo json_encode([
        'ok'    => true,
        'token' => makeToken($userId),
        'user'  => $userData,
        'userId'=> $userId,
    ]);
    break;

// ─────────────────────────────────────────────────────────────────────────
// 전체 데이터 조회
// ─────────────────────────────────────────────────────────────────────────
case 'getAll':
    requireAuth();

    $stmt = db()->query(
        "SELECT table_name, row_data FROM ams_data ORDER BY table_name, row_index"
    );
    $result = [];
    while ($r = $stmt->fetch()) {
        $result[$r['table_name']][] = json_decode($r['row_data'], true);
    }

    echo json_encode(['ok' => true, 'data' => $result]);
    break;

// ─────────────────────────────────────────────────────────────────────────
// 테이블 저장 (전체 덮어쓰기)
// ─────────────────────────────────────────────────────────────────────────
case 'saveTable':
    requireAuth();

    $table = $body['table'] ?? '';
    $rows  = $body['rows']  ?? null;

    if (!$table || !is_array($rows)) {
        http_response_code(400);
        die(json_encode(['error' => 'table과 rows가 필요합니다']));
    }
    if (!in_array($table, ALLOWED_TABLES, true)) {
        http_response_code(400);
        die(json_encode(['error' => "알 수 없는 테이블: $table"]));
    }

    db()->beginTransaction();
    db()->prepare("DELETE FROM ams_data WHERE table_name=?")->execute([$table]);

    $stmt = db()->prepare(
        "INSERT INTO ams_data (table_name, row_index, row_data) VALUES (?, ?, ?)"
    );
    foreach ($rows as $i => $row) {
        // users 테이블 저장 시 클라이언트에서 password 관련 필드 제거 (보안)
        if ($table === 'users') {
            unset($row['password'], $row['password_hash']);
        }
        $stmt->execute([$table, (int)$i, json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }

    db()->commit();
    echo json_encode(['ok' => true, 'saved' => count($rows)]);
    break;

// ─────────────────────────────────────────────────────────────────────────
// 비밀번호 변경
// ─────────────────────────────────────────────────────────────────────────
case 'changePassword':
    $userId      = requireAuth();
    $oldPassword = $body['oldPassword'] ?? '';
    $newPassword = $body['newPassword'] ?? '';

    if (!$oldPassword || !$newPassword) {
        http_response_code(400);
        die(json_encode(['error' => 'oldPassword와 newPassword가 필요합니다']));
    }
    if (mb_strlen($newPassword) < 4) {
        http_response_code(400);
        die(json_encode(['error' => '새 비밀번호는 4자 이상이어야 합니다']));
    }

    $stmt = db()->prepare("SELECT password_hash FROM ams_auth WHERE user_id=?");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($oldPassword, $row['password_hash'])) {
        http_response_code(403);
        die(json_encode(['error' => '현재 비밀번호가 올바르지 않습니다']));
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    db()->prepare("UPDATE ams_auth SET password_hash=? WHERE user_id=?")
        ->execute([$newHash, $userId]);

    echo json_encode(['ok' => true]);
    break;

// ─────────────────────────────────────────────────────────────────────────
default:
    http_response_code(404);
    echo json_encode(['error' => "알 수 없는 action: $action"]);
}
