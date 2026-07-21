import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 glass border border-destructive/20 rounded-3xl max-w-2xl mx-auto my-12 space-y-4 relative z-50">
          <h3 className="text-xl font-bold text-destructive">Application Render Error</h3>
          <p className="text-sm font-semibold text-foreground/80">
            {this.state.error && this.state.error.toString()}
          </p>
          {this.state.errorInfo && (
            <pre className="text-xs p-4 bg-secondary/50 border border-border/40 rounded-2xl overflow-auto max-h-60 text-muted-foreground whitespace-pre-wrap">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-secondary text-foreground hover:bg-secondary/70 font-semibold rounded-xl text-xs transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-lg hover:shadow-primary/20 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
