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
                <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-rose-500/5 blur-3xl" />
                        <div className="absolute bottom-1/3 -right-20 w-60 h-60 rounded-full bg-orange-500/5 blur-3xl" />
                    </div>
                    
                    <div className="card max-w-md w-full p-8 text-center animate-scale-in relative">
                        {/* Top danger accent */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #ef4444, #f97316, transparent)" }} />
                        
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative"
                            style={{ background: "rgba(239,68,68,0.1)" }}
                        >
                            <div className="absolute inset-0 rounded-2xl bg-rose-500/10 animate-pulse" />
                            <AlertTriangle size={28} className="text-red-500 relative" />
                        </div>
                        <h1 className="text-xl font-bold font-display mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h1>
                        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            An unexpected error occurred. Please try again or refresh the page.
                        </p>
                        {this.state.error && (
                            <div
                                className="rounded-xl p-4 mb-6 text-left"
                                style={{
                                    background: "rgba(239,68,68,0.06)",
                                    border: "1px solid rgba(239,68,68,0.12)",
                                }}
                            >
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500 mb-1.5">Error Details</p>
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all leading-relaxed">
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
