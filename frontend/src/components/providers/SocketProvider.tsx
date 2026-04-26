'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';


interface SocketContextData {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // The backend uses API_BASE_URL which might be http://localhost:3001/api/v1
    // We need just the origin for Socket.io
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socketOrigin = base.endsWith('/api/v1') ? base.replace('/api/v1', '') : base;

    const socketInstance = io(socketOrigin, {
      auth: { token },
      transports: ['polling', 'websocket'], // Robust fallback mechanism
    });

    socketInstance.on('connect', () => {
      console.log('🔗 WebSocket Connected');
      setIsConnected(true);
      // Backend automatically joins us to our tenant ID based on the JWT
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected');
      setIsConnected(false);
    });

    // Subscriptions to standard events
    socketInstance.on('candidate:created', (data: any) => {
      toast.success(`New Candidate: ${data.name}`);
    });

    socketInstance.on('candidate:moved', (data: any) => {
      toast(`Candidate journey updated`, { icon: '🔄' });
    });

    socketInstance.on('candidate:evaluated', (data: any) => {
      toast.success(`Evaluation submitted for candidate`);
    });

    socketInstance.on('interview:scheduled', (data: any) => {
      toast.success(`New interview scheduled!`);
    });

    socketInstance.on('sla:breached', (data: any) => {
      toast.error(`SLA Breach Alert: Stage overdue.`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
