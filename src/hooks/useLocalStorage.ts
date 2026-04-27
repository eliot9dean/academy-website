import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useState + localStorage 동기화 훅
 *
 * ── 저장 전략 ──────────────────────────────────────────────────
 *  핵심 원칙: setValue 호출 시 항상 localStorage 최신값을 직접 읽어 계산
 *
 *  문제가 된 이전 방식의 두 가지 버그:
 *  ① setStored(updater) 안의 updater는 React 렌더 페이즈(비동기)에서 실행되므로
 *    바로 뒤에서 latestRef.current를 읽으면 아직 이전 값임
 *  ② 같은 키(ams_db_tables_v2)를 사용하는 훅이 여러 개 마운트되면
 *    각자 오래된 React state를 기반으로 덮어써서 서로의 데이터를 지워버림
 *
 *  해결:
 *  • setValue 시 localStorage.getItem 으로 항상 최신값 동기 읽기
 *  • 계산한 next 값을 즉시 localStorage.setItem (동기 쓰기)
 *  • setStored(next) 로 React state 업데이트 (UI 반응)
 *  • storage 이벤트로 다른 탭 실시간 동기화
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {

  const keyRef = useRef(key);
  keyRef.current = key;

  const initialRef = useRef(initialValue);

  /** localStorage에서 최신값을 동기로 읽기 */
  const readStorage = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(keyRef.current);
      return raw !== null ? (JSON.parse(raw) as T) : initialRef.current;
    } catch {
      return initialRef.current;
    }
  }, []);

  const [stored, setStored] = useState<T>(readStorage);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      // ① 항상 localStorage 최신값을 직접 읽어 prev로 사용
      //    (React state는 stale할 수 있고, 같은 키 공유 훅끼리 덮어쓰기 방지)
      const current = readStorage();
      const next = typeof value === 'function'
        ? (value as (p: T) => T)(current)
        : value;

      // ② localStorage에 즉시 동기 저장 (SPA 이동·새로고침 모두 안전)
      try {
        window.localStorage.setItem(keyRef.current, JSON.stringify(next));
      } catch {
        // 저장 용량 초과 등 무시
      }

      // ③ React state 업데이트 → UI 리렌더링
      setStored(next);
    },
    [readStorage],
  );

  /** 다른 브라우저 탭에서 같은 키가 변경될 때 실시간 동기화 */
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== keyRef.current || e.newValue === null) return;
      try {
        setStored(JSON.parse(e.newValue) as T);
      } catch {
        // 파싱 오류 무시
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const clear = useCallback(() => {
    window.localStorage.removeItem(keyRef.current);
    setStored(initialRef.current);
  }, []);

  return [stored, setValue, clear];
}
