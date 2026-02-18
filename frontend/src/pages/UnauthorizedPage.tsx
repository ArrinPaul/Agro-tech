import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient">
            <div className="card text-center max-w-md w-full p-10 animate-scale-in">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: "rgba(239,68,68,0.1)" }}
                >
                    <ShieldOff size={36} className="text-red-500" />
                </div>
                <h1 className="text-5xl font-black font-display mb-2" style={{ color: "var(--text-primary)" }}>403</h1>
                <h2 className="text-xl font-semibold font-display mb-3" style={{ color: "var(--text-secondary)" }}>Access Denied</h2>
                <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
                    You don't have the required permissions to access this page.
                    Contact your administrator to request access.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <ArrowLeft size={15} /> Go Back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Home size={15} /> Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
