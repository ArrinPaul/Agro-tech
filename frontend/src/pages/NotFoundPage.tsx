import { useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient">
            <div className="card text-center max-w-md w-full p-10 animate-scale-in">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: "rgba(5,150,105,0.1)" }}
                >
                    <MapPin size={36} style={{ color: "var(--brand-600)" }} />
                </div>
                <h1 className="text-6xl font-black font-display mb-2" style={{ color: "var(--text-primary)" }}>404</h1>
                <h2 className="text-xl font-semibold font-display mb-3" style={{ color: "var(--text-secondary)" }}>Page Not Found</h2>
                <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
                    The page you're looking for doesn't exist or has been moved.
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
