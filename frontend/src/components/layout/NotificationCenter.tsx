'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Users, MessageSquare, AlertTriangle, Calendar, Circle } from 'lucide-react';
import { notificationApi } from '@/lib/api';
import { useSocket } from '../providers/SocketProvider';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  const loadNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    // Load initially
    loadNotifications();

    // Re-load on standard socket events (could be optimized to prepend to state instead)
    if (socket) {
      const refresh = () => loadNotifications();
      socket.on('candidate:created', refresh);
      socket.on('candidate:moved', refresh);
      socket.on('candidate:evaluated', refresh);
      socket.on('interview:scheduled', refresh);
      socket.on('sla:breached', refresh);

      return () => {
        socket.off('candidate:created', refresh);
        socket.off('candidate:moved', refresh);
        socket.off('candidate:evaluated', refresh);
        socket.off('interview:scheduled', refresh);
        socket.off('sla:breached', refresh);
      };
    }
  }, [socket]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CANDIDATE_CREATED': return <Users className="h-4 w-4 text-blue-500" />;
      case 'STAGE_MOVED': return <Circle className="h-4 w-4 text-[#c8ff00]" />;
      case 'CANDIDATE_EVALUATED': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'INTERVIEW_SCHEDULED': return <Calendar className="h-4 w-4 text-emerald-500" />;
      case 'SLA_VIOLATION': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c8ff00]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/20 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl ring-1 ring-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200 origin-top-right">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
            <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] uppercase tracking-widest font-bold text-[#c8ff00] hover:text-emerald-500 bg-slate-900 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`px-6 py-4 flex gap-4 transition-colors ${!n.isRead ? 'bg-[#c8ff00]/5 hover:bg-[#c8ff00]/10' : 'hover:bg-slate-50'}`}
                    onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  >
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-white shadow-sm ring-1 ring-[#c8ff00]/50' : 'bg-slate-100'}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 cursor-pointer">
                      <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#c8ff00] mt-2 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
