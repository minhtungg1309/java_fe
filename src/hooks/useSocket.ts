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
    avatar?: string;
  };
  createdDate?: string;
  [key: string]: unknown;
}

/**
 * Cấu trúc call offer
 */
export interface CallOffer {
  callerId: string;
  calleeId: string;
  sdp: string;
  type: string;
  callType: 'audio' | 'video';
  callId: string;
  // Add caller information
  callerInfo?: {
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    displayName?: string;
  };
}

/**
 * Cấu trúc call answer
 */
export interface CallAnswer {
  callerId: string;
  calleeId: string;
  sdp: string;
  type: string;
  callId: string;
}

/**
 * Cấu trúc ICE candidate
 */
export interface IceCandidate {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
  callId: string;
  fromUserId: string;
  toUserId: string;
}

/**
 * Cấu trúc call event (status)
 */
export interface CallEvent {
  callId: string;
  callerId: string;
  calleeId: string;
  event: 'accept' | 'reject' | 'busy' | 'end' | 'offline' | 'error';
  reason?: string;
}

/**
 * Định nghĩa các event từ server đến client
 */
type ServerToClientEvents = {
  message: (message: string | IncomingMessage) => void;
  'incoming-call': (callOffer: CallOffer) => void;
  'call-answer': (callAnswer: CallAnswer) => void;
  'call-answered': (callAnswer: CallAnswer) => void; // **ADD THIS**
  'ice-candidate': (iceCandidate: IceCandidate) => void;
  'call-status': (callEvent: CallEvent) => void;
  'call-ended': (callEvent: CallEvent) => void;
};

/**
 * Định nghĩa các event từ client đến server
 */
type ClientToServerEvents = {
  'call-offer': (callOffer: CallOffer) => void;
  'call-answer': (callAnswer: CallAnswer) => void;
  'ice-candidate': (iceCandidate: IceCandidate) => void;
  'call-event': (callEvent: CallEvent) => void;
};

/**
 * Hook quản lý kết nối WebSocket với server
 * Hỗ trợ kết nối tự động, reconnect và xử lý tin nhắn + call
 * 
 * @param onMessage - Callback xử lý tin nhắn đến
 * @param onIncomingCall - Callback xử lý cuộc gọi đến
 * @param onCallAnswer - Callback xử lý trả lời cuộc gọi
 * @param onIceCandidate - Callback xử lý ICE candidate
 * @param onCallStatus - Callback xử lý trạng thái cuộc gọi
 * @param onCallEnded - Callback xử lý kết thúc cuộc gọi
 * @returns Reference đến socket instance
 */
export function useSocket(
  onMessage?: (data: IncomingMessage) => void,
  onIncomingCall?: (callOffer: CallOffer) => void,
  onCallAnswer?: (callAnswer: CallAnswer) => void,
  onIceCandidate?: (iceCandidate: IceCandidate) => void,
  onCallStatus?: (callEvent: CallEvent) => void,
  onCallEnded?: (callEvent: CallEvent) => void
) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  
  // Store callbacks in refs to avoid re-creating socket connection
  const callbacksRef = useRef({
    onMessage,
    onIncomingCall,
    onCallAnswer,
    onIceCandidate,
    onCallStatus,
    onCallEnded,
  });

  // Update callbacks
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onIncomingCall,
      onCallAnswer,
      onIceCandidate,
      onCallStatus,
      onCallEnded,
    };
  }, [onMessage, onIncomingCall, onCallAnswer, onIceCandidate, onCallStatus, onCallEnded]);

  // Khởi tạo và quản lý kết nối socket
  useEffect(() => {
    if (!socketRef.current) {
      console.log('Initializing socket connection...');

      // Get user ID for connection
      const getUserId = (): string => {
        try {
          const token = getToken();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.userId || payload.user_id;
          }
        } catch (error) {
          console.error('Error parsing token:', error);
        }
        
        return localStorage.getItem('userId') || 
               localStorage.getItem('username') || 
               'default-user-id';
      };

      const userId = getUserId();
      const token = getToken() ?? '';
      const connectionUrl = `${CONFIG.SOCKET}?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}`;

      console.log('Connecting socket with userId:', userId);

      // Khởi tạo socket với cấu hình
      socketRef.current = io(connectionUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Xử lý sự kiện kết nối
      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected:', socketRef.current?.id);
      });

      // Xử lý sự kiện ngắt kết nối
      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      // Xử lý lỗi kết nối
      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      // Xử lý tin nhắn đến
      socketRef.current.on('message', (message: string | IncomingMessage) => {
        try {
          const parsed: IncomingMessage =
            typeof message === 'string' ? JSON.parse(message) : message;
          console.log('📨 Message received:', parsed);
          callbacksRef.current.onMessage?.(parsed);
        } catch (e) {
          console.error('Invalid socket message:', e);
        }
      });

      // Xử lý cuộc gọi đến
      socketRef.current.on('incoming-call', (callOffer: CallOffer) => {
        console.log('📞 Incoming call received:', callOffer);
        callbacksRef.current.onIncomingCall?.(callOffer);
      });

      // Xử lý trả lời cuộc gọi
      socketRef.current.on('call-answer', (callAnswer: CallAnswer) => {
        console.log('✅ Call answer received:', callAnswer);
        callbacksRef.current.onCallAnswer?.(callAnswer);
      });

      // **ADD: Handle call-answered event**
      socketRef.current.on('call-answered', (callAnswer: CallAnswer) => {
        console.log('✅ Call answered received:', callAnswer);
        callbacksRef.current.onCallAnswer?.(callAnswer);
      });

      // Xử lý ICE candidate
      socketRef.current.on('ice-candidate', (iceCandidate: IceCandidate) => {
        console.log('🧊 ICE candidate received:', iceCandidate);
        callbacksRef.current.onIceCandidate?.(iceCandidate);
      });

      // Xử lý trạng thái cuộc gọi
      socketRef.current.on('call-status', (callEvent: CallEvent) => {
        console.log('📞 Call status received:', callEvent);
        callbacksRef.current.onCallStatus?.(callEvent);
      });

      // Xử lý kết thúc cuộc gọi
      socketRef.current.on('call-ended', (callEvent: CallEvent) => {
        console.log('📞 Call ended received:', callEvent);
        callbacksRef.current.onCallEnded?.(callEvent);
      });

      // Debug: Log all events
      if (process.env.NODE_ENV === 'development') {
        socketRef.current.onAny((event, ...args) => {
          console.log('🔍 Socket event:', event, args);
        });
      }
    }

    // Cleanup khi component unmount
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  return socketRef;
}

/**
 * Simple useSocket for chat only (backward compatibility)
 */
export function useChatSocket(onMessage?: (data: IncomingMessage) => void) {
  return useSocket(onMessage);
}