import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class VisionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[VisionErrorBoundary] Caught error:', error, errorInfo);
  }

  public handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: null });
    this.props.onReset?.();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="vision-error-boundary absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 select-none">
          <div className="flex flex-col items-center max-w-sm p-6 bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">AR Rendering Notice</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {this.props.fallbackMessage || this.state.errorMessage || 'WebGL context or vision pipeline encountered an error.'}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Pipeline</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
