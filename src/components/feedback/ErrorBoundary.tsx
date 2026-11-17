import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** O que não carregou: a listagem (padrão) ou o detalhe do modal (UC08). */
  message?: string;
  /** Chamado antes de remontar os filhos. */
  onReset?: () => void;
  onError?: (error: unknown, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center text-primary">
        <p>{this.props.message ?? "Não foi possível carregar os animes."}</p>
        <button
          type="button"
          onClick={this.reset}
          className="h-8 rounded-control bg-primary px-4 font-semibold text-sm text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}
