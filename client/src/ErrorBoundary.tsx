import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <h2>Đã có lỗi xảy ra</h2>
          <p>Vui lòng tải lại trang để tiếp tục.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: '#F75940',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 20,
              padding: '7px 16px',
              height: 32,
              cursor: 'pointer',
            }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
