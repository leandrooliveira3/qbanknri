import React from 'react';

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
    // Log opcional
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <div className="p-0">
            {this.props.fallback}
            {this.state.error?.message && (
              <div className="mt-2 px-6 pb-4 text-xs text-muted-foreground">
                Detalhes do erro: {this.state.error.message}
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="p-6 text-center">
          <p>Ocorreu um erro inesperado.</p>
          {this.state.error?.message && (
            <p className="mt-2 text-xs text-muted-foreground">Detalhes do erro: {this.state.error.message}</p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
