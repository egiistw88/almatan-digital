import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="min-h-screen inset-0 absolute z-[999] bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0a0a0c] border border-white/5 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none"></div>
             <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-inner relative z-10">
                <AlertTriangle className="w-10 h-10 text-red-500" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Terjadi Kesalahan UI</h2>
             <p className="text-zinc-400 mb-8 leading-relaxed relative z-10">
               Maaf, ada sesuatu yang tidak beres pada tampilan aplikasi. Silakan muat ulang halaman ini untuk memulihkan keadaan.
             </p>
             <button
               onClick={this.handleRefresh}
               className="w-full py-4 bg-white text-black font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg relative z-10"
             >
               <RefreshCw className="w-5 h-5" />
               Muat Ulang Aplikasi
             </button>
             {this.state.error && (
                <div className="mt-8 p-4 bg-black/50 border border-white/5 rounded-xl text-left overflow-auto max-h-32 relative z-10">
                  <p className="text-[10px] text-zinc-500 font-mono whitespace-pre-wrap">{this.state.error.toString()}</p>
                </div>
             )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
