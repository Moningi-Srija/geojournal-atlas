import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      let errorMessage = '';
      if (this.state.error instanceof Error) {
        errorMessage = this.state.error.message || '';
      } else if (typeof this.state.error === 'string') {
        errorMessage = this.state.error;
      } else if (this.state.error && typeof (this.state.error as any).message === 'string') {
        errorMessage = (this.state.error as any).message;
      }
      
      const isWebGL = errorMessage.toLowerCase().includes('webgl');
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050510] text-white p-6 z-50">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold mb-3">
              {isWebGL ? "Hardware Acceleration Required" : "Something went wrong"}
            </h2>
            <p className="text-white/60 mb-6 text-sm leading-relaxed">
              {isWebGL 
                ? "The 3D Globe requires WebGL. Please enable Hardware Acceleration in your browser settings (Chrome: Settings > System > Use hardware acceleration when available)." 
                : this.state.error?.message || "An unexpected error occurred while rendering the globe."}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
