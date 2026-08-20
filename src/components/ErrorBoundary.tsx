import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("selected_token_mint");
      window.location.hash = "#/";
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0B] text-[#E5E5E5] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#121215] border border-[#26262B] shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Something went wrong</h2>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {this.state.error?.message || "An unexpected error occurred while rendering the page."}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
