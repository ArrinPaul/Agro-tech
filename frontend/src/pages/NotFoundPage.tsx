import { useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft, Home, Leaf } from "lucide-react";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl" />
                {/* Floating icons */}
                <div className="absolute top-[20%] left-[15%] opacity-[0.06]"><Leaf size={48} className="rotate-[-20deg]" /></div>
                <div className="absolute bottom-[25%] right-[18%] opacity-[0.06]"><MapPin size={40} className="rotate-[15deg]" /></div>
            </div>

            <div className="card text-center max-w-md w-full p-10 animate-scale-in relative">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, var(--brand-500), var(--brand-400), transparent)" }} />
                
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
                    style={{ background: "rgba(5,150,105,0.1)" }}
                >
                    <MapPin size={36} style={{ color: "var(--brand-600)" }} />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <span className="text-amber-500 text-xs font-bold">?</span>
                    </div>
                </div>
                <h1 className="text-7xl font-black font-display mb-2 bg-gradient-to-br from-emerald-600 to-teal-500 bg-clip-text text-transparent">404</h1>
                <h2 className="text-xl font-semibold font-display mb-3" style={{ color: "var(--text-secondary)" }}>Page Not Found</h2>
                <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    The page you're looking for doesn't exist or has been moved to another field.
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
