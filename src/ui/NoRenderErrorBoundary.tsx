import React from "react";
import { captureException } from "../utils/sentry";

// Hides a component that failed to render rather than breaking the whole
// page/popup, and reports the error so it isn't silently lost.
export class NoRenderErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    captureException(error, { componentStack: errorInfo?.componentStack });
  }

  override render() {
    return this.state.hasError ? null : this.props.children;
  }
}
