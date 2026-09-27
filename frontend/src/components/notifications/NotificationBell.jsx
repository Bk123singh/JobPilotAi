import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Sparkles,
  Briefcase,
  Users,
  Clock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'STATUS_UPDATE':
      return <CheckCircle2 className="w-4 h-4 text-brand-600" />;
    case 'MATCH_ALERT':
      return <Sparkles className="w-4 h-4 text-emerald-600" />;
    case 'APPLICATION':
      return <Users className="w-4 h-4 text-indigo-600" />;
    default:
      return <Briefcase className="w-4 h-4 text-slate-500" />;
  }
};

const formatTimeAgo = (dateStr) => {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch unread count (polls every 30s)
  const { data: countData } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 30000,
  });

  const unreadCount = countData?.data?.unreadCount || 0;

  // 2. Fetch list when open
  const { data: listData, isLoading } = useQuery({
    queryKey: ['notificationsList'],
    queryFn: () => notificationApi.getNotifications({ limit: 15 }),
    enabled: isOpen,
  });

  const notifications = listData?.data?.notifications || [];

  // 3. Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['unreadNotificationsCount']);
      queryClient.invalidateQueries(['notificationsList']);
    },
  });

  // 4. Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['unreadNotificationsCount']);
      queryClient.invalidateQueries(['notificationsList']);
    },
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-100 text-brand-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isLoading}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400">No new notifications right now.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex items-start space-x-3 cursor-pointer transition hover:bg-slate-50 ${
                    !notif.isRead ? 'bg-brand-50/30' : 'bg-white'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs truncate ${
                          !notif.isRead
                            ? 'font-extrabold text-slate-900'
                            : 'font-semibold text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 ml-2 whitespace-nowrap">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 pt-0.5">
                        View update <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
