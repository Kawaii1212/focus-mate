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
      // Just render nothing if the chatbot crashes, preventing the whole app from crashing
      return null;
    }

    return this.props.children;
  }
}
