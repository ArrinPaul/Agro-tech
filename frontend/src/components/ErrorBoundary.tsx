import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient">
                    <div className="card max-w-md w-full p-8 text-center animate-scale-in">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                            style={{ background: "rgba(239,68,68,0.1)" }}
                        >
                            <AlertTriangle size={28} className="text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold font-display mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h1>
                        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                            An unexpected error occurred. Please try again or refresh the page.
                        </p>
                        {this.state.error && (
                            <div
                                className="rounded-lg p-3 mb-6 text-left"
                                style={{
                                    background: "rgba(239,68,68,0.06)",
                                    border: "1px solid rgba(239,68,68,0.15)",
                                }}
                            >
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <RefreshCw size={15} /> Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-secondary"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
