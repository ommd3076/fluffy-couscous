import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AR Portal ErrorBoundary] Caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: '#090a0f',
            color: '#f8fafc',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '1.5rem',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🦊 🌀 🐰</div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
                color: '#ffffff',
              }}
            >
              AR Portal • Experience Notice
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              The portal encountered an issue while initializing graphics or device resources.
            </p>
            {this.state.error?.message && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#fda4af',
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                  textAlign: 'left',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#f59e0b',
                  color: '#020617',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Reload Experience
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.search = '?sim=1';
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #475569',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Launch Safe Simulation Mode
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
