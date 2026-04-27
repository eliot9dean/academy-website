<?php
// ─────────────────────────────────────────────────────────────────────────
// db_config.php  –  DB 접속 정보 및 API 비밀키
// ★ 이 파일을 서버에 올린 후 아래 값들을 실제 정보로 수정하세요 ★
// ─────────────────────────────────────────────────────────────────────────

define('DB_HOST', 'localhost');        // MySQL 서버 주소 (보통 localhost)
define('DB_NAME', 'academy_db');      // 데이터베이스 이름
define('DB_USER', 'db_username');     // DB 사용자 이름
define('DB_PASS', 'db_password');     // DB 비밀번호

// API 토큰 서명 키 – 반드시 긴 임의 문자열로 변경하세요!
define('API_SECRET', 'change_this_to_a_long_random_secret_string_12345');

// 토큰 유효기간 (초) – 기본 7일
define('TOKEN_TTL', 86400 * 7);
