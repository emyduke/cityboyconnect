import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-[400px]">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="font-display text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">
              An unexpected error occurred. Please try again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs max-w-[500px] mx-auto my-4 p-4 bg-gray-100 rounded-lg overflow-auto max-h-[200px]">
                {this.state.error.toString()}
                {'\n'}
                {this.state.error.stack}
              </pre>
            )}
            <button className="px-8 py-3 bg-forest text-white border-none rounded-lg font-semibold cursor-pointer transition-colors hover:bg-forest-light" onClick={this.handleReset}>
              Try Again
            </button>
            <button className="px-8 py-3 bg-transparent text-gray-700 border border-gray-300 rounded-lg font-semibold cursor-pointer transition-colors hover:bg-gray-50 ml-2" onClick={() => { window.location.href = '/dashboard'; }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
