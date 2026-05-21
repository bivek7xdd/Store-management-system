import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#030303]">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="h-14 w-14 mx-auto mb-6 rounded-[2px] bg-[#DA291C]/10 border border-[#DA291C]/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-[#DA291C]" />
            </div>
            <h1 className="text-[20px] font-bold text-white uppercase tracking-[1px] mb-3">
              Something went wrong
            </h1>
            <p className="text-[12px] text-[#888888] leading-relaxed mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 rounded-[2px] bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] font-bold uppercase tracking-[1px] flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
