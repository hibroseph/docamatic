import * as React from "react";
import { captureException } from "../utils/sentry";

// Hides a component that failed to render rather than breaking the whole
// page/popup, and reports the error so it isn't silently lost.
class NoRenderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    captureException(error, { componentStack: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (null);
    }

    return <>{this.props.children}</>
  }
}

export { NoRenderErrorBoundary };
