import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Briefcase, Award, ArrowRight, Clock, Sparkles, AlertCircle, FileCheck } from 'lucide-react';
import api from '../services/api';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=20');
      const payload = res?.data?.data || res?.data || res;
      if (payload) {
        setNotifications(payload.notifications || (Array.isArray(payload) ? payload : []));
        setUnreadCount(payload.unreadCount ?? 0);
      }
    } catch (err) {
      // Graceful error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Close on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await handleMarkAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'job_match':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'application_status':
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
      case 'application_submitted':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      case 'assessment_result':
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer border border-transparent hover:border-zinc-200"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-zinc-200/90 z-50 animate-in fade-in duration-100 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm text-zinc-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-zinc-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-700">No notifications yet</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">You will receive match alerts and application updates here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-zinc-50/80 transition-colors cursor-pointer flex items-start gap-3 ${
                    !notif.read ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                    notif.type === 'job_match' ? 'bg-emerald-50' :
                    notif.type === 'application_status' ? 'bg-indigo-50' :
                    notif.type === 'assessment_result' ? 'bg-amber-50' : 'bg-zinc-100'
                  }`}>
                    {getIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${!notif.read ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-700'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                      {notif.link && (
                        <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
                          {notif.type === 'job_match'
                            ? 'View Job'
                            : notif.type === 'application_status' || notif.type === 'application_submitted'
                            ? 'View Application'
                            : notif.type === 'assessment_result'
                            ? 'View Skill'
                            : 'Details'}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
