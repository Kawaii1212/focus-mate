"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin component error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Đã xảy ra sự cố khi tải trang này</h3>
                <p className="text-xs text-slate-400">Một ngoại lệ phía máy khách (Client-side exception) đã được chặn an toàn</p>
              </div>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 break-words">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  if (typeof window !== 'undefined') window.location.reload();
                }}
                className="bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs h-9 px-4 font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử tải lại</span>
              </Button>
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="bg-slate-950 border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs h-9 px-4 flex items-center gap-2"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Về Tổng Quan</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
