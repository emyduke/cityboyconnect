import { Component } from 'react';
import './ErrorBoundary.css';

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
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              An unexpected error occurred. Please try again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{ textAlign: 'left', fontSize: '0.75rem', maxWidth: 500, margin: '1rem auto', padding: '1rem', background: '#f5f5f5', borderRadius: 8, overflow: 'auto', maxHeight: 200 }}>
                {this.state.error.toString()}
                {'\n'}
                {this.state.error.stack}
              </pre>
            )}
            <button className="error-boundary__btn" onClick={this.handleReset}>
              Try Again
            </button>
            <button className="error-boundary__btn error-boundary__btn--secondary" onClick={() => { window.location.href = '/dashboard'; }}>
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
