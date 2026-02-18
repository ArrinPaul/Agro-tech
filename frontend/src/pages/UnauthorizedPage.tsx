import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldOff size={36} className="text-red-600" />
                </div>
                <h1 className="text-5xl font-black text-gray-900 mb-2">403</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-3">Access Denied</h2>
                <p className="text-sm text-gray-500 mb-8">
                    You don't have the required permissions to access this page.
                    Contact your administrator to request access.
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
