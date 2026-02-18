import { useState } from "react";
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { useNotifications } from "../utils/phase8-features";

const NOTIFICATION_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const NOTIFICATION_STYLES = {
  info: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300",
  success: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300",
  warning: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900 dark:border-amber-700 dark:text-amber-300",
  error: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300",
};

const ACTION_STYLES = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
  secondary: "bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500",
  danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
};

export default function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationAction = (notificationId: string, action: () => void) => {
    action();
    markAsRead(notificationId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Mark all read
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button
                      onClick={clearAll}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Bell size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const IconComponent = NOTIFICATION_ICONS[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                        !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 p-1 rounded-full ${NOTIFICATION_STYLES[notification.type]}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                                  title="Mark as read"
                                >
                                  <Check size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                title="Remove"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatRelativeTime(notification.timestamp)}
                          </p>

                          {/* Actions */}
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {notification.actions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleNotificationAction(notification.id, action.action)}
                                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    ACTION_STYLES[action.style || "secondary"]
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}