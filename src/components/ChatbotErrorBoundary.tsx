'use client';
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChatbotErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chatbot error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Render the error to see what's wrong
      return (
        <div className="fixed bottom-6 right-6 z-[100] w-80 p-4 bg-red-100 text-red-900 border border-red-500 rounded shadow-lg">
          <h3 className="font-bold">Chatbot Error</h3>
          <p className="text-sm break-words">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
