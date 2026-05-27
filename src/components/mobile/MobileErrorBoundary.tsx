import { Component, type ErrorInfo, type ReactNode } from "react";
import { BTN_PRIMARY } from "./mobileTheme";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

/** Prevents a single failed card/image from white-screening the native shell. */
export class MobileErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[MobileErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[40dvh] flex-col items-center justify-center gap-4 overflow-hidden bg-black px-6 text-center">
          <p className="text-lg font-semibold text-white">
            {this.props.label ?? "Something went wrong"}
          </p>
          <p className="text-sm text-[#A1A1AA]">Tap below to try again.</p>
          <button type="button" onClick={this.handleRetry} className={`${BTN_PRIMARY} max-w-xs`}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
