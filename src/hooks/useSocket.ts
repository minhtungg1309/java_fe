import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../services/localStorageService';
import { CONFIG } from '../configurations/configuration';

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

type ServerToClientEvents = {
  message: (message: string | IncomingMessage) => void;
};

type ClientToServerEvents = Record<string, never>;

export function useSocket(onMessage?: (data: IncomingMessage) => void) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const onMessageRef = useRef<typeof onMessage>(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!socketRef.current) {
      console.log('Initializing socket connection...');

      const token = getToken() ?? '';
      const connectionUrl = `${CONFIG.SOCKET}?token=${encodeURIComponent(token)}`;

      socketRef.current = io(connectionUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });

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