import { type ReactNode } from "react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 py-16 px-6 text-center">
            <div className="flex justify-center mb-4 text-gray-300">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-gray-400 max-w-sm mx-auto mb-5">{description}</p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}
