import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../services/localStorageService';
import { CONFIG } from '../configurations/configuration';

/**
 * Cấu trúc tin nhắn đến từ server qua socket
 */
export interface IncomingMessage {
  id: string;
  conversationId: string;
  me?: boolean;
  message?: string;
  content?: string;
  sender?: {
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  createdDate?: string;
  [key: string]: unknown;
}

/**
 * Định nghĩa các event từ server đến client
 */
type ServerToClientEvents = {
  message: (message: string | IncomingMessage) => void;
};

/**
 * Định nghĩa các event từ client đến server
 */
type ClientToServerEvents = Record<string, never>;

/**
 * Hook quản lý kết nối WebSocket với server
 * Hỗ trợ kết nối tự động, reconnect và xử lý tin nhắn
 * 
 * @param onMessage - Callback xử lý tin nhắn đến
 * @returns Reference đến socket instance
 */
export function useSocket(onMessage?: (data: IncomingMessage) => void) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const onMessageRef = useRef<typeof onMessage>(onMessage);

  // Cập nhật callback xử lý tin nhắn
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Khởi tạo và quản lý kết nối socket
  useEffect(() => {
    if (!socketRef.current) {
      console.log('Initializing socket connection...');

      const token = getToken() ?? '';
      const connectionUrl = `${CONFIG.SOCKET}?token=${encodeURIComponent(token)}`;

      // Khởi tạo socket với cấu hình
      socketRef.current = io(connectionUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Xử lý sự kiện kết nối
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      // Xử lý sự kiện ngắt kết nối
      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Xử lý tin nhắn đến
      socketRef.current.on('message', (message: string | IncomingMessage) => {
        try {
          const parsed: IncomingMessage =
            typeof message === 'string' ? JSON.parse(message) : message;
          onMessageRef.current?.(parsed);
        } catch (e) {
          console.error('Invalid socket message:', e);
        }
      });
    }

    // Cleanup khi component unmount
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef;
}