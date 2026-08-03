import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 d-flex align-items-center justify-content-center p-4">
          <div className="bg-white rounded-4 shadow-lg border p-5 text-center max-w-md w-100">
            <div className="bg-red-50 text-red-600 p-4 rounded-circle d-inline-flex mb-4">
              <AlertCircle size={40} />
            </div>
            <h3 className="fw-bold text-slate-800 mb-2">Something went wrong</h3>
            <p className="text-slate-500 text-sm mb-4">
              An unexpected error occurred while rendering this page.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 rounded-3 p-3 text-start mb-4 border overflow-auto max-h-[150px]">
                <code className="text-xs text-red-600 font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <div className="d-flex flex-column gap-2">
              <button
                onClick={this.handleReload}
                className="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold"
              >
                <RotateCcw size={16} /> Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="btn btn-outline-secondary text-xs border-0 py-2"
              >
                Try to Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
