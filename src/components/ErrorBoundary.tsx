import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 이 값이 바뀌면 에러 상태를 초기화 (라우트 변경 시 자동 복구) */
  resetKey?: string;
}
interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: string | undefined;
}

/**
 * 전역 에러 경계 — 하위 컴포넌트가 던진 예외를 잡아
 * 백지 화면 대신 복구 UI를 보여준다.
 * resetKey(= 현재 pathname)가 바뀌면 자동으로 상태 초기화.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  // resetKey가 바뀌면 (= 다른 페이지로 이동) 에러 상태 초기화
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] 오류 발생:', error.message);
    console.error('[ErrorBoundary] 컴포넌트 스택:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center min-h-screen p-6"
          style={{ background: '#DDE3EE' }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-xl p-8 text-center space-y-4"
            style={{ background: '#fff' }}
          >
            <div className="text-5xl">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800">화면을 불러오는 중 오류가 발생했습니다</h2>
            <p className="text-sm text-gray-500">
              다른 메뉴로 이동하거나 새로고침하면 복구됩니다.
            </p>

            {/* 개발/디버깅용 에러 메시지 */}
            {this.state.error && (
              <pre
                className="text-left text-xs rounded-xl p-3 overflow-auto max-h-40"
                style={{ background: '#FEF2F2', color: '#991B1B' }}
              >
                {this.state.error.message}
              </pre>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => window.history.back()}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ← 이전 화면
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
