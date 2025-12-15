import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-cosmic-900 text-white">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              The application encountered an unexpected error. Please refresh the page to continue.
            </p>
            <div className="bg-cosmic-800 p-4 rounded-lg text-left text-sm text-gray-400 mb-4">
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}