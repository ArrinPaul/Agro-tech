import { useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin size={36} className="text-green-600" />
                </div>
                <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
                <p className="text-sm text-gray-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        <ArrowLeft size={15} /> Go Back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                    >
                        <Home size={15} /> Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
