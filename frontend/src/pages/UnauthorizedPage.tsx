import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home, Lock } from "lucide-react";

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-rose-500/5 blur-3xl" />
                <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-orange-500/5 blur-3xl" />
                <div className="absolute top-[22%] right-[20%] opacity-[0.06]"><Lock size={44} className="rotate-[10deg]" /></div>
                <div className="absolute bottom-[20%] left-[15%] opacity-[0.06]"><ShieldOff size={48} className="rotate-[-15deg]" /></div>
            </div>

            <div className="card text-center max-w-md w-full p-10 animate-scale-in relative">
                {/* Top danger accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #ef4444, #f97316, transparent)" }} />
                
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
                    style={{ background: "rgba(239,68,68,0.1)" }}
                >
                    <ShieldOff size={36} className="text-red-500" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Lock size={12} className="text-red-500" />
                    </div>
                </div>
                <h1 className="text-7xl font-black font-display mb-2 bg-gradient-to-br from-rose-600 to-orange-500 bg-clip-text text-transparent">403</h1>
                <h2 className="text-xl font-semibold font-display mb-3" style={{ color: "var(--text-secondary)" }}>Access Denied</h2>
                <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
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
