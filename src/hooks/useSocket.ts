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
 * Signaling cho cuộc gọi
 */
export interface CallOffer {
  conversationId: string;
  sdp: string;
  type: 'offer';
  callType: 'audio' | 'video';
  callId: string;
  callerId?: string; // **Optional - backend sẽ set**
  callerInfo?: {
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    displayName: string;
  };
}

export interface CallAnswer {
  conversationId: string;
  sdp: string;
  type: 'answer';
  callId: string;
  // **BỎ callerId, calleeId - backend tự xử lý**
}

export interface CallEvent {
  conversationId: string;
  callId: string;
  event: 'accept' | 'reject' | 'busy' | 'end' | 'offline' | 'error';
  reason?: string;
  // **BỎ callerId, calleeId - backend tự xử lý**
}

export interface IceCandidate {
  conversationId: string;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
  callId: string;
  // **BỎ fromUserId - backend tự xử lý**
}

/**
 * Event từ server → client
 */
type ServerToClientEvents = {
  message: (message: string | IncomingMessage) => void;
  'incoming-call': (callOffer: CallOffer) => void;
  'call-answer': (callAnswer: CallAnswer) => void;
  'call-answered': (callAnswer: CallAnswer) => void; // confirm answer
  'ice-candidate': (iceCandidate: IceCandidate) => void;
  'call-status': (callEvent: CallEvent) => void;
  'call-ended': (callEvent: CallEvent) => void;
};

/**
 * Event từ client → server
 */
type ClientToServerEvents = {
  'call-offer': (callOffer: CallOffer) => void;
  'call-answer': (callAnswer: CallAnswer) => void;
  'ice-candidate': (iceCandidate: IceCandidate) => void;
  'call-event': (callEvent: CallEvent) => void;
};

/**
 * Hook quản lý socket kết nối
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

  // callback ref để giữ function mới nhất
  const callbacksRef = useRef({
    onMessage,
    onIncomingCall,
    onCallAnswer,
    onIceCandidate,
    onCallStatus,
    onCallEnded,
  });

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

  useEffect(() => {
    if (!socketRef.current) {
      console.log('🔌 Initializing socket connection...');

      const getUserId = (): string => {
        try {
          const token = getToken();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.userId || payload.user_id || 'default-user-id';
          }
        } catch (err) {
          console.error('❌ Error parsing token:', err);
        }
        return 'default-user-id';
      };

      const userId = getUserId();
      const token = getToken() ?? '';

      console.log('🔍 Socket connection params:', {
        userId,
        hasToken: !!token,
      });

      const connectionUrl = `${CONFIG.SOCKET}?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}`;

      socketRef.current = io(connectionUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      // **CLEAN: System events**
      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected:', socketRef.current?.id);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      // **CLEAN: Business events**
      socketRef.current.on('message', (msg) => {
        try {
          const parsed: IncomingMessage = typeof msg === 'string' ? JSON.parse(msg) : msg;
          callbacksRef.current.onMessage?.(parsed);
        } catch (e) {
          console.error('❌ Invalid socket message:', e);
        }
      });

      socketRef.current.on('incoming-call', (offer) => {
        console.log('📞 Incoming call offer:', offer);
        callbacksRef.current.onIncomingCall?.(offer);
      });

      socketRef.current.on('call-answer', (ans) => callbacksRef.current.onCallAnswer?.(ans));
      socketRef.current.on('call-answered', (ans) => callbacksRef.current.onCallAnswer?.(ans));
      socketRef.current.on('ice-candidate', (ice) => callbacksRef.current.onIceCandidate?.(ice));
      socketRef.current.on('call-status', (evt) => callbacksRef.current.onCallStatus?.(evt));
      socketRef.current.on('call-ended', (evt) => callbacksRef.current.onCallEnded?.(evt));

      // **CLEAN: Only log in development**
      if (process.env.NODE_ENV === 'development') {
        socketRef.current.onAny((event, ...args) => {
          console.log(`🔍 Socket event: ${event}`, args);
        });
      }
    }

    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef;
}

/**
 * Dùng riêng cho chat (chỉ message)
 */
export function useChatSocket(onMessage?: (data: IncomingMessage) => void) {
  return useSocket(onMessage);
}
